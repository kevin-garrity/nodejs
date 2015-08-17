$('.ac-app').click(function(e) {
    $("#appid").val($(e.target).attr("data-application-id"));
});

$('.ac-rej').click(function(e) {
    $("#ac-rej-btn").attr("href","../d/rejected/"+$(e.target).attr("data-application-id"));
});