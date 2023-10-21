from flask import Flask, render_template, request

app = Flask(__name__)

# Define a constant for the template name
INDEX_TEMPLATE = 'index.html'

@app.route('/')
def calculator():
    return render_template(INDEX_TEMPLATE)

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        expression = request.form['expression']
        result = eval(expression)
        return render_template(INDEX_TEMPLATE, result=result)
    except Exception as e:
        # Specify an exception class and handle the error
        return render_template(INDEX_TEMPLATE, result=f"Error: {e}")

if __name__ == '__main__':
    app.run(debug=True)
