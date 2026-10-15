(() => {
  'use strict';
  const categories = [
    { name: 'Length', units: [['Meters', 1], ['Feet', 0.3048], ['Kilometers', 1000], ['Miles', 1609.344], ['Centimeters', 0.01], ['Inches', 0.0254], ['Millimeters', 0.001], ['Yards', 0.9144], ['Nautical miles', 1852]] },
    { name: 'Weight / mass', units: [['Kilograms', 1], ['Pounds', 0.45359237], ['Grams', 0.001], ['Ounces', 0.028349523125], ['Milligrams', 0.000001], ['Metric tonnes', 1000], ['US short tons', 907.18474], ['Stones', 6.35029318]] },
    { name: 'Temperature', kind: 'temperature', units: [['Celsius', 1], ['Fahrenheit', 1], ['Kelvin', 1]] },
    { name: 'Volume', units: [['Liters', 1], ['US gallons', 3.785411784], ['Milliliters', 0.001], ['US cups', 0.2365882365], ['US fluid ounces', 0.0295735295625], ['US tablespoons', 0.01478676478125], ['US teaspoons', 0.00492892159375], ['Imperial gallons', 4.54609], ['Cubic meters', 1000]], note: 'US customary cooking measures; imperial gallons are listed separately.' },
    { name: 'Area', units: [['Square meters', 1], ['Square feet', 0.09290304], ['Square kilometers', 1000000], ['Square miles', 2589988.110336], ['Acres', 4046.8564224], ['Hectares', 10000], ['Square inches', 0.00064516], ['Square centimeters', 0.0001]] },
    { name: 'Speed', units: [['Kilometers/hour', 1 / 3.6], ['Miles/hour', 0.44704], ['Meters/second', 1], ['Feet/second', 0.3048], ['Knots', 1852 / 3600]] },
    { name: 'Time', units: [['Hours', 3600], ['Minutes', 60], ['Seconds', 1], ['Milliseconds', 0.001], ['Days', 86400], ['Weeks', 604800]] },
    { name: 'Digital storage', units: [['Megabytes (MB)', 1000000], ['Gigabytes (GB)', 1000000000], ['Bytes (B)', 1], ['Bits (b)', 0.125], ['Kilobytes (kB)', 1000], ['Terabytes (TB)', 1e12], ['Kibibytes (KiB)', 1024], ['Mebibytes (MiB)', 1048576], ['Gibibytes (GiB)', 1073741824], ['Tebibytes (TiB)', 1099511627776]], note: 'Decimal units use powers of 1000; binary units (KiB, MiB, GiB, TiB) use powers of 1024.' },
    { name: 'Pressure', units: [['Bar', 100000], ['PSI', 6894.757293168], ['Pascals', 1], ['Kilopascals', 1000], ['Atmospheres', 101325], ['Torr', 101325 / 760]] },
    { name: 'Energy', units: [['Joules', 1], ['Kilojoules', 1000], ['Calories (thermochemical)', 4.184], ['Kilocalories (food Calories)', 4184], ['Watt-hours', 3600], ['Kilowatt-hours', 3600000], ['BTU (international table)', 1055.05585262]] },
    { name: 'Power', units: [['Watts', 1], ['Kilowatts', 1000], ['Megawatts', 1000000], ['Mechanical horsepower', 745.6998715822702], ['Metric horsepower', 735.49875]] },
    { name: 'Angle', units: [['Degrees', Math.PI / 180], ['Radians', 1], ['Turns', 2 * Math.PI], ['Gradians', Math.PI / 200]] },
    { name: 'Frequency', units: [['Hertz', 1], ['Kilohertz', 1000], ['Megahertz', 1000000], ['Gigahertz', 1000000000], ['Revolutions/minute', 1 / 60]] },
    { name: 'Force', units: [['Newtons', 1], ['Pound-force', 4.4482216152605], ['Kilonewtons', 1000], ['Kilogram-force', 9.80665], ['Dynes', 0.00001]] },
    { name: 'Density', units: [['Kilograms/cubic meter', 1], ['Grams/cubic centimeter', 1000], ['Grams/milliliter', 1000], ['Pounds/cubic foot', 0.45359237 / 0.028316846592], ['Pounds/US gallon', 0.45359237 / 0.003785411784]] },
    { name: 'Acceleration', units: [['Meters/second squared', 1], ['Feet/second squared', 0.3048], ['Standard gravity (g)', 9.80665], ['Centimeters/second squared', 0.01]] },
    { name: 'Fuel economy', kind: 'fuel', units: [['Liters/100 km', 1], ['Miles/US gallon', 235.21458333333333], ['Miles/imperial gallon', 282.48093633182215], ['Kilometers/liter', 100]], note: 'Fuel economy values must be greater than zero. US and imperial gallons differ.' },
    { name: 'Torque', units: [['Newton-meters', 1], ['Pound-feet', 1.3558179483314004], ['Pound-inches', 0.1129848290276167], ['Kilogram-force meters', 9.80665]] },
    { name: 'Data transfer rate', units: [['Megabits/second', 1000000], ['Megabytes/second', 8000000], ['Bits/second', 1], ['Kilobits/second', 1000], ['Gigabits/second', 1000000000], ['Kilobytes/second', 8000], ['Gigabytes/second', 8000000000]], note: 'Rates use decimal units. One byte equals eight bits.' },
    { name: 'Electric current', units: [['Amperes', 1], ['Milliamperes', 0.001], ['Microamperes', 0.000001], ['Kiloamperes', 1000]] }
  ];

  function convert(value, category, from, to) {
    if (!Number.isFinite(value)) throw new Error('Enter a finite number.');
    if (category.kind === 'temperature') {
      const kelvin = from === 0 ? value + 273.15 : from === 1 ? (value - 32) * 5 / 9 + 273.15 : value;
      if (kelvin < -1e-10) throw new Error('Temperature cannot be below absolute zero.');
      return to === 0 ? kelvin - 273.15 : to === 1 ? (kelvin - 273.15) * 9 / 5 + 32 : kelvin;
    }
    if (category.kind === 'fuel') {
      if (value <= 0) throw new Error('Enter a fuel economy greater than zero.');
      const liters = from === 0 ? value : category.units[from][1] / value;
      return to === 0 ? liters : category.units[to][1] / liters;
    }
    return value * (category.units[from][1] / category.units[to][1]);
  }

  function formula(category, from, to) {
    if (from === to) return 'The value stays the same.';
    if (category.kind === 'temperature') {
      const formulas = [
        ['', 'Multiply by 9/5, then add 32.', 'Add 273.15.'],
        ['Subtract 32, then multiply by 5/9.', '', 'Subtract 32, multiply by 5/9, then add 273.15.'],
        ['Subtract 273.15.', 'Subtract 273.15, multiply by 9/5, then add 32.', '']
      ];
      return formulas[from][to];
    }
    const number = value => String(Number(value.toPrecision(12)));
    if (category.kind === 'fuel' && (from === 0 || to === 0)) {
      return 'Divide ' + number(category.units[from === 0 ? to : from][1]) + ' by the value.';
    }
    const factor = category.kind === 'fuel'
      ? category.units[to][1] / category.units[from][1]
      : category.units[from][1] / category.units[to][1];
    return factor >= 1 ? 'Multiply the value by ' + number(factor) + '.' : 'Divide the value by ' + number(1 / factor) + '.';
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { categories, convert, formula };
  if (typeof document === 'undefined') return;
  const get = name => document.getElementById('conversion-' + name);
  const category = get('category'), amount = get('value'), from = get('from'), to = get('to');
  let copyValue = '';
  const format = value => Number(value.toPrecision(12)).toLocaleString(undefined, { maximumSignificantDigits: 12 });
  function update() {
    copyValue = '';
    get('copy').disabled = true;
    get('copy-status').textContent = '';
    get('error').textContent = '';
    amount.removeAttribute('aria-invalid');
    get('result').textContent = '—';
    get('formula').textContent = formula(categories[Number(category.value)], Number(from.value), Number(to.value));
    if (amount.value.trim() === '') {
      if (amount.validity.badInput) {
        get('error').textContent = 'Enter a valid number.';
        amount.setAttribute('aria-invalid', 'true');
      }
      return;
    }
    try {
      const selected = categories[Number(category.value)];
      const value = amount.valueAsNumber;
      const result = convert(value, selected, Number(from.value), Number(to.value));
      if (!Number.isFinite(result) || (result === 0 && value !== 0 && !selected.kind)) throw new Error('This amount is outside the supported numeric range.');
      const rounded = Number(result.toPrecision(12));
      get('result').textContent = format(rounded);
      copyValue = String(rounded);
      get('copy').disabled = false;
    } catch (error) {
      get('error').textContent = error.message;
      amount.setAttribute('aria-invalid', 'true');
    }
  }
  function selectCategory() {
    const selected = categories[Number(category.value)];
    for (const select of [from, to]) {
      select.replaceChildren(...selected.units.map(([label], index) => new Option(label, index)));
    }
    to.value = '1';
    get('note').textContent = selected.note || '';
    update();
  }
  for (const [label, start, end] of [['Common conversions', 0, 8], ['More conversions', 8, 20]]) {
    const group = document.createElement('optgroup');
    group.label = label;
    for (let i = start; i < end; i++) group.append(new Option(categories[i].name, i));
    category.append(group);
  }
  category.addEventListener('change', selectCategory);
  amount.addEventListener('input', update);
  from.addEventListener('change', update);
  to.addEventListener('change', update);
  get('swap').addEventListener('click', () => {
    [from.value, to.value] = [to.value, from.value];
    update();
  });
  get('copy').addEventListener('click', async () => {
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      get('copy-status').textContent = 'Result copied.';
    } catch {
      get('copy-status').textContent = 'Could not copy automatically. Select and copy the result above.';
    }
  });
  selectCategory();
})();
