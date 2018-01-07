// $('input[type="submit"]').mousedown(function(){
//   $(this).css('background', 'rgba(131,255,73,0.8)');

// });
// $('input[type="submit"]').mouseup(function(){
//   $(this).css('background', 'background:rgba(131,255,73,0.3);');
// });

$('#loginform').click(function(){
  $('.register').slideUp('slow');
  if($('.login').css('display')=="none"){
      $('.login').slideDown('slow');
      $(this).css('border-bottom',"5px solid white ");
    }else{
      console.log("TETETETETE")
      $('#loginform').css('border',"1.5px solid white");
    }
});

$('#registerform').click(function(){
  $('.login').slideUp('slow');
  if($(".register").css("display")=="none"){
    $('.register').slideDown('slow');
    $(this).css('border-bottom',"5px solid white");
  }else{
    $('#registerform').css('border',"1.5px solid white");
  }
});



$(document).mouseup(function (e)
{
    var container = $(".login");
    var container2 = $(".register");

    if (!container.is(e.target) // if the target of the click isn't the container...
        && container.has(e.target).length === 0) // ... nor a descendant of the container
    {
        container.slideUp();
        $('#loginform').css('border',"1.5px solid white");
    }
    if (!container2.is(e.target) // if the target of the click isn't the container...
        && container2.has(e.target).length === 0) // ... nor a descendant of the container
    {
        container2.slideUp();
        $('#registerform').css('border',"1.5px solid white");
    }
});


$("#getLocation").click(function(){
    navigator.geolocation.getCurrentPosition(function(position) {
      $("#lat").val(position.coords.latitude)
      $("#long").val(position.coords.longitude)
      $.getJSON("https://maps.googleapis.com/maps/api/geocode/json?latlng="+position.coords.latitude+","+position.coords.longitude+"&key=AIzaSyD5Rds-FEP3YaTUZ4H5R22wR7WACcua1f4",function(data){
        console.log(data.results[0].formatted_address)
        $("#locationName").val(data.results[0].formatted_address)
        $("#submitButton").removeClass("disabledButton")
        $("#submitButton").removeAttr('disabled');
        $("#getLocation").html("Get Location :)")
      })
    },function(err){
      console.log("not provided")
      $("#getLocation").html("Get Location :(")
      $("#submitButton").removeClass("disabledButton")
      $("#submitButton").removeAttr('disabled');
    });
  })