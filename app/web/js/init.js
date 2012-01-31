(function(){
	
	window.APP = {};
		
	APP.socket = io.connect();
	
	var socket = APP.socket;

	
  // Key strokes.
  
  var codes = {
		"65": "a",
		"66": "b",
		"67": "c",
		"68": "d",
		"69": "e",
		"70": "f",
		"71": "g",
		"72": "h",
		"73": "i",
		"74": "j",
		"75": "k",
		"76": "l",
		"77": "m",
		"78": "n",
		"79": "o",
		"80": "p",
		"81": "q",
		"82": "r",
		"83": "s",
		"84": "t",
		"85": "u",
		"86": "v",
		"87": "w",
		"88": "x",
		"89": "y",
		"90": "z",
		
		"32": " ",
		"109": "-",
		"191": "/",
		"190": "."
	};
  
  console.log(codes['89'])
  
  var content = $('#content');
  
  var currentLine = '';
  
  $(document).keydown(function(e){
  	
  	var letter = codes[e.keyCode + ''];
  	
  	// Handle 'enter'.
  	if(e.keyCode === 13){
			
			console.log('sending console');
			
			// Send...
  		APP.socket.emit('console', currentLine, function(output){
  			//sconsole.log('-------');
  			
  			// Teplace new lines with break line.
  			output = output.replace(/\n/g, '<br />');
  			
  			console.log(output);
  			
  			content.append(output + '<br />');
  			
  		});
  		
  		// Reset line cashe
  		currentLine = '';
  		
  		content.append('<br />');
  		
  	} else if(e.keyCode === 8){
  		
  		currentLine = currentLine.slice(0, -1);
  		
  		content.html(currentLine);
  	} else {
  		
  		if(letter){
  			
  			currentLine = currentLine + letter;
  		
	  		content.html(currentLine);
	  	} else {
	  		console.log(e.keyCode)
	  	}
  	}
  	
  	  	
  	//content.append(e.keyCode);	
	});  
  
}());