import logging

import cv2
import fitz
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from paddleocr import PaddleOCR

logging.getLogger('ppocr').setLevel(logging.ERROR)

app = FastAPI(title='DMS OCR sidecar')

engine = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

RENDER_DPI = 200
MAX_PAGES = 200


def read_page(image):
    result = engine.ocr(image, cls=True)

    lines = result[0] if result and result[0] else []
    if not lines:
        return '', 0.0

    texts = [line[1][0] for line in lines]
    scores = [line[1][1] for line in lines]

    return '\n'.join(texts), round(sum(scores) / len(scores) * 100, 2)


def pdf_to_images(data):
    doc = fitz.open(stream=data, filetype='pdf')

    try:
        for page in doc[:MAX_PAGES]:
            pix = page.get_pixmap(dpi=RENDER_DPI)
            arr = np.frombuffer(pix.samples, dtype=np.uint8)
            arr = arr.reshape(pix.height, pix.width, pix.n)

            if pix.n == 4:
                arr = cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR)
            elif pix.n == 3:
                arr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)

            yield arr
    finally:
        doc.close()


@app.post('/ocr')
async def ocr(file: UploadFile = File(...)):
    data = await file.read()
    if not data:
        raise HTTPException(400, 'Empty file')

    try:
        if file.content_type == 'application/pdf':
            images = list(pdf_to_images(data))
        else:
            arr = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
            if arr is None:
                raise HTTPException(400, 'Could not decode that image')
            images = [arr]
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(400, f'Could not read that file: {err}')

    pages = []
    for index, image in enumerate(images, start=1):
        text, confidence = read_page(image)
        pages.append({'page': index, 'text': text, 'confidence': confidence})

    scored = [p['confidence'] for p in pages if p['text']]

    return {
        'engine': 'paddleocr',
        'pages': pages,
        'text': '\n\n'.join(p['text'] for p in pages if p['text']),
        'confidence': round(sum(scored) / len(scored), 2) if scored else 0.0,
    }


@app.get('/health')
async def health():
    return {'ok': True}
