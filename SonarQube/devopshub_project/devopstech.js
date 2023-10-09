const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getNumberInput(prompt, callback) {
  rl.question(prompt, (input) => {
    const number = parseFloat(input);
    if (isNaN(number)) {
      console.log('Invalid input. Please enter a valid number.');
      getNumberInput(prompt, callback);
    } else {
      callback(number);
    }
  });
}

function performOperation() {
  console.log('Calculator App');
  console.log('Available operations:');
  console.log('1. Addition (+)');
  console.log('2. Subtraction (-)');
  console.log('3. Multiplication (*)');
  console.log('4. Division (/)');
  console.log('5. Quit');

  rl.question('Select an operation (1/2/3/4/5): ', (choice) => {
    switch (choice) {
      case '1':
        getNumberInput('Enter first number: ', (num1) => {
          getNumberInput('Enter second number: ', (num2) => {
            console.log(`Result: ${num1} + ${num2} = ${num1 + num2}`);
            performOperation();
          });
        });
        break;
      case '2':
        getNumberInput('Enter first number: ', (num1) => {
          getNumberInput('Enter second number: ', (num2) => {
            console.log(`Result: ${num1} - ${num2} = ${num1 - num2}`);
            performOperation();
          });
        });
        break;
      case '3':
        getNumberInput('Enter first number: ', (num1) => {
          getNumberInput('Enter second number: ', (num2) => {
            console.log(`Result: ${num1} * ${num2} = ${num1 * num2}`);
            performOperation();
          });
        });
        break;
      case '4':
        getNumberInput('Enter dividend: ', (dividend) => {
          getNumberInput('Enter divisor: ', (divisor) => {
            if (divisor === 0) {
              console.log('Error: Division by zero.');
            } else {
              console.log(`Result: ${dividend} / ${divisor} = ${dividend / divisor}`);
            }
            performOperation();
          });
        });
        break;
      case '5':
        rl.close();
        break;
      default:
        console.log('Invalid choice. Please select a valid operation (1/2/3/4/5).');
        performOperation();
        break;
    }
  });
}

performOperation();

