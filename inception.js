//inception script (content script in a content script)

//btc-futures.js
//onBuySellFuture
//   if ( ordType === 'limit') {
//     ftuBuySell({'price': price, 'qty': qty, qty_type: 'cts', 'block': form, 'dir': dir, 'inst': inst,
//    'post_only': postOnly, 'hidden': hidden, 'time_in_force': time_in_force});
//ftuBuySell = function(data) {
//    {
//        if (validateSources([]))
//            ws.send(enc(tuple(atom('pickle'), bin('document'), bin('xuMoJf4poY/SsXnJVDJiPBiSsOEY5zRn1dqfl5JAWbQczRuA9hspEY8nwB4/sqw3RJmb6+XohGYT8dezUPDeddEe6HvNRkY8p1PW15Ik04nffQwmeAtJBPBbIH6FfRcklNwac1WSLqsW+vlqfbc9E54NlmRgiEKrTTvRwuutsYQ='), utf8_toByteArray(JSON.stringify(data)))));
//        else
//            console.log('Validation Error');
//    }
//}
//		block:"#orderform"
//		dir:"sell"
//		hidden:false
//		inst:"BTC-25MAY18"
//		post_only:false
//		price:10000
//		qty:17
//		qty_type:"cts"
//		time_in_force:"good_til_cancelled"

//wait for the word from the parent content script
document.addEventListener('inceptionEvent',function(e) {
	console.log("e.detail:"+e.detail);
	var data=JSON.parse(e.detail);
	var orders=data.orders;
	
	console.log("ftuBuySell:");
	console.log(ftuBuySell);
	//submit order
	//add all instruments from Derebit api
	var url=data.rootUrl+"/api/v1/private/"+data.side;
	for(var i=0;i<orders.length;i++) {
		var order=orders[i];
		ftuBuySell({
			"block":"#orderform",
			"dir":data.side,
			"hidden":order.hidden,
			"inst":order.instrument,
			"post_only":false,
			"price":order.price,
			"qty":order.quantity,
			"qty_type":"cts",
			"time_in_force":order.time
		});
	}
});

