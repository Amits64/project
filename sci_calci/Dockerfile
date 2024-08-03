FROM python:3.13.0b4-slim
WORKDIR /app
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
COPY sci_calci/requirements.txt requirements.txt
RUN pip install -r requirements.txt
COPY sci_calci/ /app
EXPOSE 80
CMD ["python", "app.py"]

