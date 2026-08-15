from flask import Flask, request, jsonify
import fasttext
from transformers import MarianMTModel, MarianTokenizer


app = Flask(__name__)


# --------------------------------------------------
# LOAD FASTTEXT LANGUAGE IDENTIFICATION MODEL
# --------------------------------------------------

lang_model = fasttext.load_model(
    "lid.176.bin"
)


# --------------------------------------------------
# CACHE FOR TRANSLATION MODELS
# --------------------------------------------------

nmt_models = {}


# --------------------------------------------------
# TRANSLATION FUNCTION
# --------------------------------------------------

def translate_to_english(text, source_lang):

    # If the text is already English
    if source_lang == "en":
        return text

    model_name = (
        f"Helsinki-NLP/opus-mt-{source_lang}-en"
    )

    # Load model only when required
    if model_name not in nmt_models:

        tokenizer = MarianTokenizer.from_pretrained(
            model_name
        )

        model = MarianMTModel.from_pretrained(
            model_name
        )

        nmt_models[model_name] = (
            tokenizer,
            model
        )

    else:

        tokenizer, model = nmt_models[
            model_name
        ]

    # Tokenize input
    inputs = tokenizer(
        text,
        return_tensors="pt",
        padding=True
    )

    # Generate translation
    translated = model.generate(
        **inputs
    )

    # Convert back to text
    return tokenizer.decode(
        translated[0],
        skip_special_tokens=True
    )


# --------------------------------------------------
# DISASTER REPORT PROCESSING API
# --------------------------------------------------

@app.route(
    "/api/process-disaster-report",
    methods=["POST"]
)
def process_report():

    data = request.json

    if not data:
        return jsonify({
            "status": "error",
            "message": "No JSON data received"
        }), 400

    raw_text = data.get(
        "description",
        ""
    )

    # --------------------------------------------------
    # LANGUAGE DETECTION
    # --------------------------------------------------

    predictions = lang_model.predict(
        raw_text.replace("\n", " ")
    )

    detected_lang = (
        predictions[0][0]
        .replace("__label__", "")
    )

    # --------------------------------------------------
    # TRANSLATION
    # --------------------------------------------------

    try:

        english_translation = (
            translate_to_english(
                raw_text,
                detected_lang
            )
        )

    except Exception as e:

        print(
            "Translation error:",
            e
        )

        # Fallback to original text
        english_translation = raw_text

    # --------------------------------------------------
    # CREATE PROCESSED DISPATCH DATA
    # --------------------------------------------------

    processed_payload = {

        "original_text": raw_text,

        "detected_language":
            detected_lang,

        "english_translation":
            english_translation,

        "severity":
            data.get("severityLevel"),

        "coordinates":
            data.get("location"),

        "disaster_type":
            data.get("disasterType")
    }

    # --------------------------------------------------
    # RETURN RESPONSE
    # --------------------------------------------------

    return jsonify({

        "status": "success",

        "dispatch_data":
            processed_payload

    }), 200


# --------------------------------------------------
# RUN FLASK APPLICATION
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        port=5000,
        debug=True
    )
