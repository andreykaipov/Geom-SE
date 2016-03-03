var i = 0;
var dragging = false;
   $('#dragbar').mousedown(function(e){
       e.preventDefault();
       
       dragging = true;
       var ghostbar = $('<div>',
                        {id:'ghostbar',
                         css: {
                                height: $('#dragbar').innerHeight(),
                                top: $('#dragbar').offset().top
                               }
                        }).appendTo('body');
       
        $(document).mousemove(function(e){
          ghostbar.css("top",e.pageY+2);
       });
       
    });

   $(document).mouseup(function(e){
       if (dragging) 
       {
           var percentage = 100 - ((e.pageY / window.innerHeight) * 100);
           

           
           $('#codeMirror').css("height",percentage + "%");
           $('#ghostbar').remove();
           $(document).unbind('mousemove');
           dragging = false;
       }
    });
