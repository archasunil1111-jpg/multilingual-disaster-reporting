# Multilingual Disaster Reporting System

## About the Project

The Multilingual Disaster Reporting System is an AI-assisted emergency reporting platform developed to improve communication during disasters and emergencies.

The system allows users to report emergencies by providing the disaster type, severity level, description, location, photos, and videos.

The project also focuses on multilingual communication by detecting the language of emergency descriptions and translating them into English for easier processing by emergency response teams.

## Features

- Multilingual emergency reporting
- Language detection using FastText
- Machine translation using MarianMT
- GPS-based location detection
- Disaster severity selection
- Photo and video upload
- Emergency description input
- Form validation

## Technologies Used

### Frontend
- React
- TypeScript
- React Hook Form
- Zod
- Tailwind CSS

### Backend
- Python
- Flask
- FastText
- PyTorch
- Hugging Face Transformers
- MarianMT

## Project Workflow

```text
User
 ↓
Emergency Report
 ↓
Language Detection
 ↓
Translation
 ↓
Location & Severity Processing
 ↓
Processed Emergency Report
