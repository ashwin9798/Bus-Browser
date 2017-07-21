$(document).ready(function(){
  $("button").click(function(){
    $.get("http://pure-hollows-72424.herokuapp.com", function(data, status){
        alert("Data: " + data + "\nStatus: " + status);
    });
  });
});
