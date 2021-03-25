//global vars
var instruments,
  contract_quantity,
  crypto_quantity,
  scaled_side_bid,
  scaled_side_ask,
  scaled_side_error;
var quantity,
  quantity_error,
  order_count,
  order_count_error,
  range_start,
  range_start_error,
  range_end,
  range_end_error;
var hidden,
  noise,
  noise_amount,
  pnoise,
  pnoise_amount,
  shape_flat,
  shape_asc,
  shape_desc,
  shape_custom;
var scaled_preview_btn, submit_new_scaled;
var rows, scaled_preview_wrap;
var lblQuantity, lblPriceLower, lblPriceUpper;
var instrumentsData,
  minOrderSize = 0.01;
var currentUrl;
var settings, mainPanel, settingsPanel, mainLabel, settingsLabel;
var useLive, useTestnet, rootUrl;
var bgnd = chrome.extension.getBackgroundPage();

var current_price_btn,
  save_preset_btn,
  preset_name,
  preset_list,
  delete_presets;
var presets = [];
var presetUID = 1;

/**
 * Called on the window onload event (when the popup has loaded)
 */
function init() {
  //get panels
  mainLabel = document.getElementById('mainLabel');
  settingsLabel = document.getElementById('settingsLabel');
  settingsLabel.className = 'hide';

  mainPanel = document.getElementById('main_panel');
  settingsPanel = document.getElementById('settings_panel');
  settingsPanel.className = 'hide';

  settings = document.getElementById('settings');
  settings.main = true;
  settings.addEventListener('click', function (e) {
    settings.main = !settings.main;
    console.log(settings.main);
    if (settings.main) {
      settingsPanel.classList.add('hide');
      mainPanel.classList.remove('hide');
      settingsLabel.classList.add('hide');
      mainLabel.classList.remove('hide');
    } else {
      mainPanel.classList.add('hide');
      settingsPanel.classList.remove('hide');
      mainLabel.classList.add('hide');
      settingsLabel.classList.remove('hide');
    }
  });

  useLive = document.getElementById('useLive');
  useLive.addEventListener('click', updateRootUrl);
  useTestnet = document.getElementById('useTestnet');
  useTestnet.addEventListener('click', updateRootUrl);

  //update rootUrl from storage
  chrome.storage.local.get({ rootUrl: 'https://www.deribit.com' }, function (
    items
  ) {
    rootUrl = items.rootUrl;
    useTestnet.checked = useTestnet.value == rootUrl;
    useLive.checked = useLive.value == rootUrl;

    //get active instruments for this network
    initInstruments();

    //check current url
    checkCurrentUrl();
  });

  //get labels
  lblQuantity = document.getElementById('lblQuantity');
  lblPriceLower = document.getElementById('lblPriceLower');
  lblPriceUpper = document.getElementById('lblPriceUpper');

  //initialize form vars
  instruments = document.getElementById('instruments');

  contract_quantity = document.getElementById('contract_quantity');
  crypto_quantity = document.getElementById('crypto_quantity');

  scaled_side_bid = document.getElementById('scaled_side_bid'); //buy
  scaled_side_bid.addEventListener('click', function () {
    scaled_side_error.className = 'hide';
  });
  scaled_side_ask = document.getElementById('scaled_side_ask'); //sell
  scaled_side_ask.addEventListener('click', function () {
    scaled_side_error.className = 'hide';
  });
  scaled_side_error = document.getElementById('scaled_side_error');

  quantity = document.getElementById('quantity');
  quantity_error = document.getElementById('quantity_error');
  quantity.addEventListener('input', validateQuantity);

  order_count = document.getElementById('order_count');
  order_count_error = document.getElementById('order_count_error');
  order_count.addEventListener('input', validateOrderCount);

  range_start = document.getElementById('range_start');
  range_start_error = document.getElementById('range_start_error');
  range_start.addEventListener('input', validateRangeStart);

  range_end = document.getElementById('range_end');
  range_end_error = document.getElementById('range_end_error');
  range_end.addEventListener('input', validateRangeEnd);

  hidden = document.getElementById('hidden');
  noise = document.getElementById('noise');
  noise_amount = document.getElementById('noise_amount');
  noise_amount.addEventListener('change', adjustVariance);

  pnoise = document.getElementById('pnoise');
  pnoise_amount = document.getElementById('pnoise_amount');
  pnoise_amount.addEventListener('change', adjustVariance);

  shape_flat = document.getElementById('shape_flat');
  shape_asc = document.getElementById('shape_asc');
  shape_desc = document.getElementById('shape_desc');
  shape_custom = document.getElementById('shape_custom');

  scaled_preview_btn = document.getElementById('scaled_preview_btn');
  scaled_preview_btn.addEventListener('click', preview);
  scaled_preview_btn.preview = true;

  submit_new_scaled = document.getElementById('submit_new_scaled');
  submit_new_scaled.addEventListener('click', preview);
  submit_new_scaled.preview = false;

  rows = document.getElementById('rows');
  scaled_preview_wrap = document.getElementById('scaled_preview_wrap');

  current_price_btn = document.getElementById('current_price_btn');
  current_price_btn.addEventListener('click', getCurrentPrice);
  save_preset_btn = document.getElementById('save_preset_btn');
  save_preset_btn.addEventListener('click', savePreset);
  preset_name = document.getElementById('preset_name');
  preset_list = document.getElementById('preset_list');
  delete_presets = document.getElementById('delete_presets');
  delete_presets.addEventListener('click', deletePresets);

  loadPresets();
}

function savePresets() {
  //save list of presets
  chrome.storage.local.set({ presets: presets }, function () {
    console.log('presets saved');
  });
}

function loadPresets() {
  //clear existing preset list, default to [] (none)
  chrome.storage.local.get({ presets: [] }, function (items) {
    presets = items.presets;
    console.log('presets loaded');

    //update display
    updatePresets();
  });
}

function deletePresets() {
  presets = [];
  savePresets();
  updatePresets();
}

function updatePresets() {
  //clear presets list on screen
  while (preset_list.hasChildNodes()) {
    preset_list.removeChild(preset_list.lastChild);
  }

  //show presets
  for (var i = 0; i < presets.length; i++) {
    var preset = presets[i];
    //update the id to something not used yet
    preset.id = 'preset' + presetUID;

    //create the preset button and append to the list
    createPresetButton(preset);

    //increment UID
    presetUID++;
  }
}

function showPreset() {
  var preset = this.preset;
  preset_name.value = preset.name;
  instruments.value = preset.instrument;
  scaled_side_bid.checked = preset.scaled_side_bid;
  scaled_side_ask.checked = preset.scaled_side_ask;
  contract_quantity.checked = preset.contract_quantity;
  crypto_quantity.checked = preset.crypto_quantity;
  quantity.value = preset.quantity;
  order_count.value = preset.order_count;
  range_start.value = preset.range_start;
  range_end.value = preset.range_end;
  hidden.checked = preset.hidden;
  noise.checked = preset.noise;
  noise_amount.value = preset.noise_amount;
  pnoise.checked = preset.pnoise;
  pnoise_amount.value = preset.pnoise_amount;
  shape_flat.checked = preset.shape_flat;
  shape_asc.checked = preset.shape_asc;
  shape_desc.checked = preset.shape_desc;
}

function savePreset() {
  // <button class="preset_btn" name="button">Preset 2<span>X</span></button>
  // current_price_btn,save_preset_btn,preset_name,preset_list

  //create preset object
  var presetName = preset_name.value.trim().substr(0, 14);
  //check if name is blank
  if (presetName.length == 0) {
    //get number of next preset, skip if already exists
    var i = presets.length;
    var result;
    do {
      i++;
      presetName = 'Preset ' + i;
      result = presets.find((obj) => obj.name === presetName);
      console.log('i:' + i + '\tresult:' + result);
    } while (result);
  }

  var preset = {
    name: presetName,
    id: 'preset' + presetUID,
    instrument: instruments.value,
    scaled_side_bid: scaled_side_bid.checked,
    scaled_side_ask: scaled_side_ask.checked,
    contract_quantity: contract_quantity.checked,
    crypto_quantity: crypto_quantity.checked,
    quantity: quantity.value.trim(),
    order_count: order_count.value.trim(),
    range_start: range_start.value.trim(),
    range_end: range_end.value.trim(),
    hidden: hidden.checked,
    noise: noise.checked,
    noise_amount: noise_amount.value.trim(),
    pnoise: pnoise.checked,
    pnoise_amount: pnoise_amount.value.trim(),
    shape_flat: shape_flat.checked,
    shape_asc: shape_asc.checked,
    shape_desc: shape_desc.checked,
  };
  //create the preset button and append to the list
  createPresetButton(preset);
  //add to list of presets
  presets.push(preset);
  //save list of presets
  savePresets();
  //increment UID
  presetUID++;
}

function createPresetButton(preset) {
  //create preset button
  var button = document.createElement('div');
  button.className = 'preset_btn';
  var txt = document.createTextNode(preset.name);
  button.appendChild(txt);
  button.addEventListener('click', showPreset);
  button.preset = preset;
  var span = document.createElement('span');
  span.addEventListener('click', deletePreset);
  span.id = preset.id;
  button.appendChild(span);
  txt = document.createTextNode('X');
  span.appendChild(txt);

  //append to button list
  preset_list.appendChild(button);
}

function deletePreset(event) {
  //don't let preset button activate
  event.stopPropagation();
  //delete from presets
  //	console.log("this.id:"+this.id);
  //	console.log("presets1:"+JSON.stringify(presets));
  presets = presets.filter((preset) => {
    return preset.id != this.id;
  });
  //	console.log("presets2:"+JSON.stringify(presets));
  //save list of presets
  savePresets();

  //get position in the list
  preset_list.removeChild(this.parentNode);
}

function getCurrentPrice() {
  //get the current price and fill in the lower and upper price
  //get all price index from Derebit api
  getPriceIndex(function (result) {
    if (result !== null) {
      //update range prices
      range_end.value = range_start.value = result.result.index_price;
      console.log('result:' + JSON.stringify(result));
    }
  });
}

function checkCurrentUrl() {
  //check current url of active tab on current window to be sure it is derebit
  chrome.tabs.query({ active: true, windowId: bgnd.parentWindowId }, function (
    tabs
  ) {
    currentUrl = tabs[0].url;
    //if current page url is not deribit, open a new deribit tab
    console.log(
      'currentUrl:' +
        currentUrl +
        ' index: ' +
        currentUrl.indexOf('deribit.com')
    );
    if (currentUrl.indexOf(rootUrl) != 0) {
      chrome.tabs.create(
        { windowId: bgnd.parentWindowId, url: rootUrl },
        (tab) => {
          //make sure this window is focused
          chrome.windows.update(bgnd.windowId, { focused: true });
        }
      );
    }
  });
}

function updateRootUrl() {
  rootUrl = this.value;
  chrome.storage.local.set({ rootUrl: rootUrl });

  //check current url, open tab to selected testnet or live site
  checkCurrentUrl();
}

function preview(e) {
  console.log('preview');
  e.preventDefault();

  //clear table first
  scaled_preview_wrap.style.display = 'none';
  while (rows.firstChild) rows.removeChild(rows.firstChild);

  //retrieve and validate most of the settings
  var settings;
  //return if there are errors
  if (!(settings = validateAll())) return;

  console.log('settings:' + JSON.stringify(settings));
  //	{
  //  "instrument":"XBTUSD",
  //	"side":"Sell",
  //	"quantity":100,
  //	"orderCount":10,
  //	"rangeStart":100,
  //	"rangeEnd":1000,
  //	"hidden":true,
  //	"noise":true,
  //	"noiseAmount":5,
  //	"pnoise":true,
  //	"pnoiseAmount":0.1,
  //	"type":"Simple" //or "Contract"
  //  "shape":"Flat" //or "Asc" or "Desc" or "Custom" (custom not implemented yet)
  //	}

  var m = 0,
    v = [],
    amounts = [],
    dPrice =
      (settings.rangeEnd - settings.rangeStart) / (settings.orderCount - 1),
    prices = [];
  //get prices
  for (var p = 0; p < settings.orderCount; p++) {
    var price;
    if (p == 0) {
      //first number so use start
      price = Number(settings.rangeStart);
    } else if (p == settings.orderCount - 1) {
      //last numbers so use end
      price = Number(settings.rangeEnd);
    } else {
      //calculate price
      price = settings.rangeStart + dPrice * p;
      if (settings.pnoise) {
        price = addNoise(
          price,
          settings.pnoiseAmount,
          settings.rangeStart,
          settings.rangeEnd,
          0
        );
      }
    }
    price = parseFloat((Math.round(price * 2) / 2).toFixed(1));
    prices.push(price);
  }

  console.log('prices: ' + JSON.stringify(prices));

  //apply price shape to get amount range
  switch (settings.shape) {
    case 'flat':
      amounts = shapeAmounts(settings.quantity, settings.orderCount, [
        20,
        20,
        20,
        20,
        20,
      ]);
      break;
    case 'asc':
      amounts = shapeAmounts(settings.quantity, settings.orderCount, [
        1,
        12.5,
        25,
        37.5,
        50,
      ]);
      break;
    case 'desc':
      amounts = shapeAmounts(settings.quantity, settings.orderCount, [
        50,
        37.5,
        25,
        12.5,
        1,
      ]);
      break;
    //		case "custom":
    //		amounts=shapeAmounts(settings.quantity, settings.orderCount, t["custom-dist"].split("-").map(function(t) {
    //		return Number(t)
    //		}))
  }

  //add amounts noise if checked
  if (settings.noise) {
    amounts = amounts.map(function (e) {
      return addNoise(e, settings.noiseAmount, minOrderSize, 999999, 0);
    });
  }

  //adjust amounts to total quantity to be traded
  var k = amounts.reduce(function (a, b) {
    return a + b;
  }, 0);
  var x = settings.quantity - k;
  var adj = x / amounts.length;
  //adjust value and make sure it is at least minimum trade value
  amounts = amounts.map(function (e) {
    var amt = e + adj;
    return amt < minOrderSize ? minOrderSize : amt;
  });

  //adjust amounts to total quantity to be traded again
  k = amounts.reduce(function (a, b) {
    return a + b;
  }, 0);
  x = settings.quantity - k;
  for (var w = 0; w < amounts.length; w++) {
    var C = amounts[w] + x; // APP.util.sum(y[w], x);
    //add difference only if result is at least minimum order size
    if (C >= minOrderSize) {
      amounts[w] = C;
    }
  }

  //use integer settings if contract based
  if (settings.type == 'Contract') {
    contracSize = selectedContractSize();
    amounts = amounts.map(function (e) {
      return Math.ceil((e + 1) / contracSize) * contracSize;
    });
  }

  //adjust amounts precision
  amounts = amounts.map(function (e) {
    return parseFloat(Number(e).toFixed(8));
  });

  //calculate avg entry price
  var totals = prices
    .map(function (v, i) {
      var weight = amounts[i];
      var sum = weight * v;
      return [sum, weight];
    })
    .reduce(
      function (accumulator, currentValue) {
        return [
          accumulator[0] + currentValue[0],
          accumulator[1] + currentValue[1],
        ];
      },
      [0, 0]
    );
  var avgEntryPrice = parseFloat((totals[0] / totals[1]).toFixed(3)); //totals[0]: weight prices total, totals[1]: amounts total
  var amountTotals = parseFloat(totals[1].toFixed(3));

  //check if preview or submit
  if (e.target.preview) {
    //fill table with values
    var tr, td, span, span2, i;
    for (
      var header = true, j = settings.orderCount - 1;
      j >= 0;
      j--, header = false
    ) {
      tr = document.createElement('tr');

      if (header) {
        td = document.createElement('td');
        td.colSpan = '3';
        td.textContent = 'Total Amount / Avg Entry Price :';
        tr.style.borderBottom = '1px outset';
        tr.appendChild(td);
      } else {
        //buy/sell
        td = document.createElement('td');
        td.classList.add('buySell', 'tooltip');
        tr.appendChild(td);
        span = document.createElement('span');
        span.classList.add(settings.side.toLowerCase() + 'ing-icon');
        td.appendChild(span);
        i = document.createElement('i');
        i.classList.add('fa', 'fa-circle');
        span.appendChild(i);
        span = document.createElement('span');
        span.classList.add('tooltiptextright');
        span.textContent = settings.type + ' Quantity ' + settings.side;
        td.appendChild(span);

        //instrument
        td = document.createElement('td');
        td.classList.add('col-info', 'col-info1');
        td.textContent = settings.instrument;
        tr.appendChild(td);

        //type
        td = document.createElement('td');
        td.classList.add('col-info', 'col-info2');
        td.textContent = 'Limit' + (settings.hidden ? ' ' : '');
        tr.appendChild(td);
        if (settings.hidden) {
          span = document.createElement('span');
          span.classList.add('tooltip');
          td.appendChild(span);
          i = document.createElement('i');
          i.classList.add('fa', 'fa-eye-slash');
          span.appendChild(i);
          span2 = document.createElement('span');
          span2.className = 'tooltiptextright';
          span2.textContent = 'Hidden Order';
          span.appendChild(span2);
        }
      }

      //amount
      td = document.createElement('td');
      td.className = 'col-num';
      td.textContent = header ? amountTotals : amounts[j];
      tr.appendChild(td);

      //price
      td = document.createElement('td');
      td.classList.add('price', 'col-currency');
      td.textContent = header ? avgEntryPrice : prices[j];
      tr.appendChild(td);

      //add row
      rows.appendChild(tr);

      //done with header row
      if (header) {
        header = false;
        j++;
      }
    }

    scaled_preview_wrap.style.display = 'block';
  } else {
    //submit order
    var orders = [];

    contractSize = selectedContractSize();
    //create all orders
    for (var j = settings.orderCount - 1; j >= 0; j--) {
      //create basic order
      var order = {
        instrument: settings.instrument,
        price: '' + prices[j],
        time: 'good_till_cancel',
        hidden: settings.hidden,
      };
      //add quantity based on contract type
      if (settings.type == 'Contract') {
        order.quantity = '' + amounts[j];
      } else {
        //calculate contracts that match this amount of crypto
        order.quantity = '' + Math.floor((amounts[j] * prices[j]) / contractSize);
      }
      //add to list of orders
      orders.push(order);
    }

    //submit order to content script of active page to place the order
    chrome.tabs.query(
      { active: true, windowId: bgnd.parentWindowId },
      function (tabs) {
        console.log('bgnd.parentWindowId: ' + bgnd.parentWindowId);
        console.log('tabs[0].id: ' + tabs[0].id);
        console.log('tabs[0].url: ' + tabs[0].url);
        console.log('orders:' + JSON.stringify(orders));
        
        function* ordersGen(orders){
          for (const order of orders) {
            yield order;
          }
        }
        
        const gen = ordersGen(orders);
        const start = setInterval(() => {
          var next = gen.next();             
          if(next.done){                     
              clearInterval(start);
          } else {
            console.log(next.value);
            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                orders: [next.value],
                rootUrl: rootUrl,
                side: settings.side.toLowerCase(),
              });
          }
        }, 200)
        
      }
    );

    return;
  }
}

function addNoise(value, noiseAmount, range_start, range_end, level) {
  var randomPosNeg = Math.random() - 0.5 < 0 ? -1 : 1;
  var percentageChange =
    (100 + Math.random() * noiseAmount * randomPosNeg) / 100;
  var valueNew = value * percentageChange;
  if (valueNew < range_start) {
    if (level >= 5) {
      return range_start;
    } else {
      return addNoise(value, noiseAmount, range_start, range_end, level + 1);
    }
  } else if (valueNew > range_end) {
    if (level >= 5) {
      return range_end;
    } else {
      return addNoise(value, noiseAmount, range_start, range_end, level + 1);
    }
  } else {
    return valueNew;
  }
}

function shapeAmounts(totalAmount, orderCount, shapeArray) {
  function interpolate(t) {
    var e,
      i,
      n = 0;
    if (
      (Object.keys(o)
        .map(function (t) {
          return Number(t);
        })
        .sort(function (t, e) {
          return t > e ? 1 : -1;
        })
        .map(function (r) {
          t == r && (i = o[r]), e || (t < r ? (e = r) : (n = r));
        }),
      i)
    )
      return i;
    var r = o[e] - o[n]; // APP.util.subtract(o[e], o[n])
    var a = e - n; // APP.util.subtract(e, n)
    var s = (t - n) / a; // APP.util.divide(APP.util.subtract(t, n), a);
    return r * s + o[n]; // APP.util.sum(o[n], APP.util.multiply(r, s))
  }

  //get the total of these shape values
  var shapeArrayTotal = shapeArray.reduce(function (a, b) {
    return a + b;
  }, 0);
  console.log('shapeArrayTotal: ' + shapeArrayTotal);

  //get the delta change of the order count
  var dOrderCount =
    (shapeArray.map(function (t) {
      return t / shapeArrayTotal;
    }),
    1 / (orderCount - 1));
  console.log('dOrderCount: ' + dOrderCount);

  //create shape interpolation map
  var o = {};
  for (var i = 0; i < shapeArray.length; i++) {
    // if shapeArray.length is 10, then 0 to 9
    var n = i / (shapeArray.length - 1); // (0 to 9)/9 -> 0/9 to 9/9
    var a = shapeArray[i] / shapeArrayTotal; //if flat shapeArray [0 to 9]/100 -> 0.00 to 0.09
    o[n] = a;
  }
  console.log('o[]: ' + JSON.stringify(o));

  //create amounts
  for (var s = [], l = 0; l < orderCount; l++) {
    var c = l * dOrderCount;
    var u = interpolate(c);
    s.push(u * totalAmount);
  }
  console.log('s[]: ' + JSON.stringify(s));

  //total all amounts
  var amountsTotal = s.reduce(function (a, b) {
    return a + b;
  }, 0);
  var ratio = amountsTotal / totalAmount;

  //scale all amounts by ratio
  return (s = s.map(function (t) {
    return t / ratio;
  }));
}

function validateAll() {
  var success = true;
  var settings = {};

  //validate quantities
  if (!(settings.quantity = validateQuantity())) success = false;
  if (!(settings.orderCount = validateOrderCount())) success = false;
  if (!(settings.rangeStart = validateRangeStart())) success = false;
  if (!(settings.rangeEnd = validateRangeEnd())) success = false;

  console.log('success:' + success);
  //return with all errors
  if (!success) return false;

  //check for Buy/Sell selected
  if (scaled_side_bid.checked) settings.side = 'Buy';
  else if (scaled_side_ask.checked) settings.side = 'Sell';

  if (!settings.side) {
    //no side so show error and return
    scaled_side_error.className = 'error';
    success = false;
  } else {
    scaled_side_error.className = 'hide';
  }

  //make sure end is greater than start
  if (parseFloat(range_end.value) <= parseFloat(range_start.value)) {
    range_end_error.textContent =
      'The price upper must be greater than the price lower.';
    range_end_error.className = 'error';
    success = false;
  }

  //get hidden,amount,price
  settings.hidden = hidden.checked;
  settings.noise = noise.checked;
  settings.noiseAmount = adjustVariance.call(noise_amount);
  settings.pnoise = pnoise.checked;
  settings.pnoiseAmount = adjustVariance.call(pnoise_amount);

  //instrument
  settings.instrument = instruments.value;

  //	,shape_flat,shape_asc,shape_desc,shape_custom
  if (shape_flat.checked) {
    settings.shape = 'flat';
  } else if (shape_asc.checked) {
    settings.shape = 'asc';
  } else if (shape_desc.checked) {
    settings.shape = 'desc';
  } else if (shape_custom.checked) {
    settings.shape = 'custom';
  }
  //contract_quantity,crypto_quantity
  if (crypto_quantity.checked) {
    settings.type = 'Crypto';
  } else if (contract_quantity.checked) {
    settings.type = 'Contract';
    //check to be sure order count<=quantity
    if (settings.quantity < settings.orderCount) {
      quantity_error.textContent =
        'The contract quantity must be as much as than the order count.';
      quantity_error.className = 'error';
      order_count_error.textContent =
        'The order count must be less or equal to the contract quantity.';
      order_count_error.className = 'error';
      success = false;
    }
    //check to be sure order count<=quantity
    if (settings.quantity != Math.floor(settings.quantity)) {
      quantity_error.textContent =
        'The contract quantity must an integer amount.';
      quantity_error.className = 'error';
      success = false;
    }
  }

  return success ? settings : false;
}

function validateQuantity() {
  var value = quantity.value.trim();
  if (value.length == 0) {
    quantity_error.textContent = 'This field is required.';
    quantity_error.className = 'error';
    return false;
  } else if (isNaN(value)) {
    quantity_error.textContent = 'Please enter a valid number.';
    quantity_error.className = 'error';
    return false;
  } else {
    quantity_error.className = 'hide';
    return parseFloat(value);
  }
}

function validateOrderCount() {
  var value = order_count.value.trim();
  var n = parseInt(value);
  if (value.length == 0) {
    order_count_error.textContent = 'This field is required.';
    order_count_error.className = 'error';
    return false;
  } else if (!/^\d+$/.test(value)) {
    order_count_error.textContent = 'Please enter digits only.';
    order_count_error.className = 'error';
    return false;
  } else if (n < 2) {
    order_count_error.textContent =
      'Please enter a value greater than or equal to 2.';
    order_count_error.className = 'error';
    return false;
  } else if (n > 100) {
    order_count_error.textContent =
      'Please enter a value less than or equal to 100.';
    order_count_error.className = 'error';
    return false;
  } else {
    order_count_error.className = 'hide';
    return n;
  }
}

function validateRangeStart() {
  var value = range_start.value.trim();
  var n = Math.abs(parseFloat(value));
  if (value.length == 0) {
    range_start_error.textContent = 'This field is required.';
    range_start_error.className = 'error';
    return false;
  } else if (n + '' != value) {
    range_start_error.textContent = 'Please enter a valid number.';
    range_start_error.className = 'error';
    return false;
  } else {
    range_start_error.className = 'hide';
    return parseFloat(value);
  }
}

function validateRangeEnd() {
  var value = range_end.value.trim();
  var n = Math.abs(parseFloat(value));
  if (value.length == 0) {
    range_end_error.textContent = 'This field is required.';
    range_end_error.className = 'error';
    return false;
  } else if (n + '' != value) {
    range_end_error.textContent = 'Please enter a valid number.';
    range_end_error.className = 'error';
    return false;
  } else {
    range_end_error.className = 'hide';
    return parseFloat(value);
  }
}

function adjustVariance() {
  console.log('adjustVariance');
  var value = this.value.trim();
  var n = Math.abs(parseFloat(value));
  if (value.length == 0) {
    this.value = this.dataset.defaultValue;
  } else if (n + '' != value) {
    this.value = this.dataset.defaultValue;
  }
  console.log(value);
  return parseFloat(value);
}

function initInstruments() {
  //clear existing instruments
  while (instruments.options.length > 0) instruments.remove(0);

  //add all instruments from BitMex api
  getInstruments(function (result) {
    if (result !== null) {
      if (result.success) {
        instrumentsData = result.result;
        //only show futures
        instrumentsData = instrumentsData.filter((obj) => obj.kind === 'future');
        // sort by currency / expiration
        instrumentsData = instrumentsData.sort((a,b) => (a.baseCurrency+a.expiration > b.baseCurrency+b.expiration)?1:((b.baseCurrency+b.expiration > a.baseCurrency+a.expiration)?-1:0))

        for (var i = 0; i < instrumentsData.length; i++) {
          var instrument = instrumentsData[i];
          var option = document.createElement('option');
          option.text = option.value = instrument.instrumentName;
          if (i == 0) option.selected = true;
          instruments.add(option);
        }
      }
    }
  });
}

function getInstruments(callback) {
  //add price index from Derebit api (only Futures)
  var url = rootUrl + '/api/v1/public/getinstruments';
  var req = new XMLHttpRequest();

  req.onreadystatechange = function (e) {
    if (req.readyState == 4) {
      if (req.status == 200) {
        //				console.log(req.responseText);
        callback(JSON.parse(req.responseText));
      } else {
        console.log(req.responseText);
        callback(null);
      }
    }
  };

  req.open('GET', url, true);
  req.setRequestHeader('Accept', 'application/json');
  req.send(null);
}

function getPriceIndex(callback) {
  //add USD price index from Derebit api (only Futures) based on selected instrument
  var index_name = instruments.value.split("-")[0].toLowerCase()+"_usd"
  var url = rootUrl + '/api/v2/public/get_index_price?index_name=' + index_name;
  //console.log(url);
  var req = new XMLHttpRequest();

  req.onreadystatechange = function (e) {
    if (req.readyState == 4) {
      if (req.status == 200) {
        //console.log(req.responseText);
        callback(JSON.parse(req.responseText));
      } else {
        console.log(req.responseText);
        callback(null);
      }
    }
  };

  req.open('GET', url, true);
  req.setRequestHeader('Accept', 'application/json');
  req.send(null);
}

function selectedContractSize(){
  return parseFloat(instrumentsData.filter(x => x.instrumentName == instruments.value)[0].contractSize);
}

window.onload = init;
