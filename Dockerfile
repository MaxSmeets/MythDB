FROM python:3.12-slim

WORKDIR /app
COPY backend/ /app/

RUN pip install --no-cache-dir flask && mkdir -p /app/data
RUN pip install --no-cache-dir markdown

EXPOSE 5000
CMD ["python", "app.py"]
