import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";


type DisasterType = {

  id: number;

  name: string;

  icon: string;

  color: string;

};


type District = {

  id: number;

  name: string;

  lat: string;

  lng: string;

};


type Prediction = {

  riskLevel: string;

  disasterType: string;

  severity: number;

  recommendation: string;

  summary: string;

};


const initialForm = {

  disasterTypeId: 0,

  district: "",

  detailedLocation: "",

  description: "",

  severityLevel: 3,

  peopleAffected: "",

  contactNumber: "",

  lat: "",

  lng: "",

  photoUrl: "",

  videoUrl: ""

};


function App() {

  const [
    types,
    setTypes
  ] = useState<DisasterType[]>([]);


  const [
    districts,
    setDistricts
  ] = useState<District[]>([]);


  const [
    form,
    setForm
  ] = useState(initialForm);


  const [
    prediction,
    setPrediction
  ] = useState<Prediction | null>(
    null
  );


  const [
    submitted,
    setSubmitted
  ] = useState(false);


  const [
    tab,
    setTab
  ] = useState<
    "report" | "stats"
  >("report");


  const [
    stats,
    setStats
  ] = useState<any>(null);


  const [
    loading,
    setLoading
  ] = useState(false);


  const photoRef =
    useRef<HTMLInputElement>(null);


  const videoRef =
    useRef<HTMLInputElement>(null);


  useEffect(() => {

    Promise.all([

      fetch(
        "/api/disaster-types"
      ).then(
        response =>
          response.json()
      ),

      fetch(
        "/api/districts"
      ).then(
        response =>
          response.json()
      )

    ]).then(
      ([typesData, districtData]) => {

        setTypes(typesData);

        setDistricts(
          districtData
        );

      }
    );

  }, []);


  useEffect(() => {

    fetch("/api/stats")
      .then(
        response =>
          response.json()
      )
      .then(
        setStats
      );

  }, [submitted]);


  const selectedType =
    useMemo(

      () =>

        types.find(
          type =>
            type.id ===
            form.disasterTypeId
        ),

      [
        types,
        form.disasterTypeId
      ]

    );


  function update<
    K extends keyof typeof form
  >(
    key: K,
    value: typeof form[K]
  ) {

    setForm(
      previous => ({

        ...previous,

        [key]: value

      })
    );

  }


  function selectDistrict(
    name: string
  ) {

    const district =
      districts.find(
        item =>
          item.name === name
      );


    setForm(
      previous => ({

        ...previous,

        district: name,

        lat:
          district?.lat ?? "",

        lng:
          district?.lng ?? ""

      })
    );

  }


  function useGPS() {

    if (!navigator.geolocation) {

      alert(
        "GPS is not supported by this browser."
      );

      return;

    }


    navigator.geolocation
      .getCurrentPosition(

        position => {

          setForm(
            previous => ({

              ...previous,

              lat:
                position.coords
                  .latitude
                  .toString(),

              lng:
                position.coords
                  .longitude
                  .toString()

            })
          );

        },

        error => {

          alert(
            error.message
          );

        }

      );

  }


  function readFile(

    file:
      File | undefined,

    key:
      "photoUrl" |
      "videoUrl",

    max:
      number

  ) {

    if (!file) return;


    if (file.size > max) {

      alert(
        `File is too large. Maximum allowed size is ${
          max / 1024 / 1024
        }MB.`
      );

      return;

    }


    const reader =
      new FileReader();


    reader.onload = () => {

      update(
        key,
        String(
          reader.result
        )
      );

    };


    reader.readAsDataURL(
      file
    );

  }


  async function submit(
    event: React.FormEvent
  ) {

    event.preventDefault();


    if (
      !form.disasterTypeId
    ) {

      alert(
        "Please select a disaster type."
      );

      return;

    }


    if (!form.district) {

      alert(
        "Please select a district."
      );

      return;

    }


    if (
      form.description.trim()
        .length < 10
    ) {

      alert(
        "Please provide a more detailed description."
      );

      return;

    }


    setLoading(true);


    try {

      const response =
        await fetch(
          "/api/disaster-reports",
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify({

                ...form,

                peopleAffected:
                  form.peopleAffected
                    ? Number(
                        form.peopleAffected
                      )
                    : undefined

              })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Submission failed."
        );

      }


      setPrediction(
        data.aiPrediction
      );


      setSubmitted(true);


      setForm(
        initialForm
      );


      if (
        photoRef.current
      ) {

        photoRef.current.value =
          "";

      }


      if (
        videoRef.current
      ) {

        videoRef.current.value =
          "";

      }

    }

    catch (error) {

      alert(

        error instanceof Error

          ? error.message

          : "Submission failed."

      );

    }

    finally {

      setLoading(false);

    }

  }


  return (

    <div className="app-shell">

      <header className="topbar">

        <div>

          <div className="brand">

            🚨 Disaster Response

          </div>

          <div className="subtitle">

            Multilingual Emergency
            Reporting System

          </div>

        </div>


        <div className="status-pill">

          ● Emergency Portal

        </div>

      </header>


      <main className="container">

        <div className="hero">

          <div>

            <h1>
              Report a Disaster
            </h1>

            <p>

              Submit emergency
              information quickly
              and help responders
              understand the situation.

            </p>

          </div>


          <div className="nav-tabs">

            <button

              className={
                tab === "report"
                  ? "active"
                  : ""
              }

              onClick={() =>
                setTab("report")
              }

            >

              Report

            </button>


            <button

              className={
                tab === "stats"
                  ? "active"
                  : ""
              }

              onClick={() =>
                setTab("stats")
              }

            >

              Statistics

            </button>

          </div>

        </div>


        {tab === "report" ? (

          <>

            {submitted &&
              prediction && (

                <section
                  className="success-card"
                >

                  <div
                    className="success-icon"
                  >

                    ✓

                  </div>


                  <div>

                    <h2>

                      Report Submitted
                      Successfully

                    </h2>


                    <p>

                      Authorities can
                      review the submitted
                      emergency information.

                    </p>


                    <div
                      className="prediction"
                    >

                      <strong>

                        {prediction.riskLevel}
                        {" "}
                        Risk

                      </strong>


                      <span>

                        {prediction.summary}

                      </span>


                      <span>

                        {
                          prediction
                            .recommendation
                        }

                      </span>

                    </div>

                  </div>


                  <button
                    onClick={() =>
                      setSubmitted(false)
                    }
                  >

                    New Report

                  </button>

                </section>

              )}


            <form
              className="card"
              onSubmit={submit}
            >

              <h2>
                Emergency Report
              </h2>


              <label>
                Disaster Type
              </label>


              <div className="type-grid">

                {types.map(type => (

                  <button

                    type="button"

                    key={type.id}

                    className={

                      `type-card ${
                        form.disasterTypeId ===
                        type.id
                          ? "selected"
                          : ""
                      }`

                    }

                    onClick={() =>
                      update(
                        "disasterTypeId",
                        type.id
                      )
                    }

                  >

                    <span
                      className="type-icon"
                    >

                      {type.icon}

                    </span>


                    <span>

                      {type.name}

                    </span>

                  </button>

                ))}

              </div>


              <label>
                Location
              </label>


              <div className="row">

                <select

                  value={
                    form.district
                  }

                  onChange={e =>
                    selectDistrict(
                      e.target.value
                    )
                  }

                >

                  <option value="">

                    Select District

                  </option>


                  {districts.map(
                    district => (

                      <option
                        key={district.id}
                      >

                        {district.name}

                      </option>

                    )
                  )}

                </select>


                <button

                  type="button"

                  className="secondary"

                  onClick={useGPS}

                >

                  📍 Use GPS

                </button>

              </div>


              {(form.lat ||
                form.lng) && (

                <div
                  className="coordinates"
                >

                  Coordinates:
                  {" "}
                  {form.lat},
                  {" "}
                  {form.lng}

                </div>

              )}


              <label>

                Detailed Location

              </label>


              <input

                value={
                  form.detailedLocation
                }

                onChange={e =>
                  update(
                    "detailedLocation",
                    e.target.value
                  )
                }

                placeholder="Area, landmark, street or nearby location"

              />


              <label>

                Describe the Situation

              </label>


              <textarea

                value={
                  form.description
                }

                onChange={e =>
                  update(
                    "description",
                    e.target.value
                  )
                }

                placeholder="Describe what happened, current conditions and immediate risks..."

              />


              <label>

                Severity Level:
                {" "}
                <b>
                  {form.severityLevel}
                </b>

              </label>


              <input

                className="range"

                type="range"

                min="1"

                max="5"

                value={
                  form.severityLevel
                }

                onChange={e =>
                  update(
                    "severityLevel",
                    Number(
                      e.target.value
                    )
                  )
                }

              />


              <div
                className="range-labels"
              >

                <span>
                  Minor
                </span>

                <span>
                  Moderate
                </span>

                <span>
                  Severe
                </span>

              </div>


              <div
                className="two-col"
              >

                <div>

                  <label>

                    People Affected

                  </label>


                  <input

                    type="number"

                    min="0"

                    value={
                      form.peopleAffected
                    }

                    onChange={e =>
                      update(
                        "peopleAffected",
                        e.target.value
                      )
                    }

                    placeholder="0"

                  />

                </div>


                <div>

                  <label>

                    Your Contact Number

                  </label>


                  <input

                    value={
                      form.contactNumber
                    }

                    onChange={e =>
                      update(
                        "contactNumber",
                        e.target.value
                      )
                    }

                    placeholder="+91"

                  />

                </div>

              </div>


              <div
                className="two-col"
              >

                <div>

                  <label>

                    Upload Photo

                  </label>


                  <input

                    ref={photoRef}

                    type="file"

                    accept="image/*"

                    onChange={e =>
                      readFile(
                        e.target.files?.[0],
                        "photoUrl",
                        5 *
                        1024 *
                        1024
                      )
                    }

                  />


                  {form.photoUrl && (

                    <img

                      className="preview"

                      src={
                        form.photoUrl
                      }

                      alt="Photo preview"

                    />

                  )}

                </div>


                <div>

                  <label>

                    Upload Video

                  </label>


                  <input

                    ref={videoRef}

                    type="file"

                    accept="video/*"

                    onChange={e =>
                      readFile(
                        e.target.files?.[0],
                        "videoUrl",
                        20 *
                        1024 *
                        1024
                      )
                    }

                  />


                  {form.videoUrl && (

                    <video

                      className="preview"

                      src={
                        form.videoUrl
                      }

                      controls

                    />

                  )}

                </div>

              </div>


              <button

                className="submit"

                disabled={loading}

              >

                {loading

                  ? "Submitting..."

                  : "Submit Emergency Report"

                }

              </button>

            </form>

          </>

        ) : (

          <section
            className="stats-grid"
          >

            <div
              className="stat-card"
            >

              <span>
                Total Reports
              </span>

              <strong>

                {stats?.totalReports ?? 0}

              </strong>

            </div>


            <div
              className="card chart-card"
            >

              <h2>
                Severity Distribution
              </h2>


              {Object.entries(
                stats?.bySeverity ?? {}
              ).map(
                ([key, value]) => (

                  <div
                    className="bar-row"
                    key={key}
                  >

                    <span>
                      Level {key}
                    </span>


                    <div
                      className="bar"
                    >

                      <i

                        style={{
                          width:
                            `${Math.min(
                              Number(value) *
                              20,
                              100
                            )}%`
                        }}

                      />

                    </div>


                    <b>
                      {String(value)}
                    </b>

                  </div>

                )
              )}


              {!Object.keys(
                stats?.bySeverity ?? {}
              ).length && (

                <p>
                  No reports yet.
                </p>

              )}

            </div>


            <div
              className="card chart-card"
            >

              <h2>
                Disaster Types
              </h2>


              {Object.entries(
                stats?.byType ?? {}
              ).map(
                ([key, value]) => (

                  <div
                    className="bar-row"
                    key={key}
                  >

                    <span>
                      {key}
                    </span>


                    <div
                      className="bar"
                    >

                      <i

                        style={{
                          width:
                            `${Math.min(
                              Number(value) *
                              20,
                              100
                            )}%`
                        }}

                      />

                    </div>


                    <b>
                      {String(value)}
                    </b>

                  </div>

                )
              )}


              {!Object.keys(
                stats?.byType ?? {}
              ).length && (

                <p>
                  No reports yet.
                </p>

              )}

            </div>

          </section>

        )}

      </main>

    </div>

  );

}


export default App;
