const billInput = document.getElementById('bill');
  const tipInput = document.getElementById('tip');
  const peopleInput = document.getElementById('people');
  const resultDiv = document.getElementById('result');

  const updateResult = () => {
    const bill = parseFloat(billInput.value);
    const tipPercent = parseFloat(tipInput.value);
    const people = parseInt(peopleInput.value);

    if (![billInput, tipInput, peopleInput].every(input => input.checkValidity()) || ![bill, tipPercent, people].every(Number.isFinite) || bill < 0 || tipPercent < 0 || people <= 0) {
      resultDiv.innerHTML = `<span class="error-message">Please enter non-negative values and at least one person.</span>`;
      return;
    }

    if (!isNaN(bill) && !isNaN(tipPercent) && !isNaN(people)) {
      const tipAmount = bill * (tipPercent / 100);
      const tipPerPerson = tipAmount / people;
      const totalAmount = bill + tipAmount;

      resultDiv.innerHTML = `
        Total tip: $${tipAmount.toFixed(2)}<br />
        Tip per person: $${tipPerPerson.toFixed(2)}<br />
        <small>Total with tip: $${totalAmount.toFixed(2)}</small>
      `;
    } else {
      resultDiv.textContent = `Total tip: $0.00`;
    }
  };

  billInput.addEventListener('input', updateResult);
  tipInput.addEventListener('input', updateResult);
  peopleInput.addEventListener('input', updateResult);
