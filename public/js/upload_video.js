/*
Copyright 2015 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

$("#upload_url").click(function(){
  if($("#youtube_url").val().match(/^(?:https?:\/\/)?(?:(?:www|m)\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/)){
    $('#video_form').append("<input type='hidden' name='videos[]' value="+$('#youtube_url').val()+">");
    $('#player').append("<iframe width='240' height='126' controls='0' src='http://www.youtube.com/embed/"+$('#youtube_url').val().split("=")[$('#youtube_url').val().split("=").length-1]+"'>");
  }
});
var videos = [];

var signinCallback = function (result){
  if(result.access_token) {
    var uploadVideo = new UploadVideo();
    uploadVideo.ready(result.access_token);
  }
};

var STATUS_POLLING_INTERVAL_MILLIS = 60 * 1000; // One minute.


/**
 * YouTube video uploader class
 *
 * @constructor
 */
var UploadVideo = function() {
  /**
   * The array of tags for the new YouTube video.
   *
   * @attribute tags
   * @type Array.<string>
   * @default ['google-cors-upload']
   */
  this.tags = ['youtube-cors-upload'];

  /**
   * The numeric YouTube
   * [category id](https://developers.google.com/apis-explorer/#p/youtube/v3/youtube.videoCategories.list?part=snippet®ionCode=us).
   *
   * @attribute categoryId
   * @type number
   * @default 22
   */
  this.categoryId = 22;

  /**
   * The id of the new video.
   *
   * @attribute videoId
   * @type string
   * @default ''
   */
  this.videoId = '';

  this.uploadStartTime = 0;
};


UploadVideo.prototype.ready = function(accessToken) {
  this.accessToken = accessToken;
  this.gapi = gapi;
  this.authenticated = true;
  this.gapi.client.request({
    path: '/youtube/v3/channels',
    params: {
      part: 'snippet',
      mine: true
    },
    callback: function(response) {
      if (response.error) {
        console.log(response.error.message);
      } else {
        $('.pre-sign-in').hide();
        $('.post-signin').fadeIn();
      }
    }.bind(this)
  });
  $('#button').on("click", this.handleUploadClicked.bind(this));
};

/**
 * Uploads a video file to YouTube.
 *
 * @method uploadFile
 * @param {object} file File object corresponding to the video to upload.
 */
UploadVideo.prototype.uploadFile = function(file) {
  var metadata = {
    snippet: {
      title: Date.now(),
      description: 'Coaching Video',
      tags: this.tags,
      categoryId: this.categoryId
    },
    status: {
      privacyStatus: 'unlisted'
    }
  };
  var uploader = new MediaUploader({
    baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
    file: file,
    token: this.accessToken,
    metadata: metadata,
    params: {
      part: Object.keys(metadata).join(',')
    },
    onError: function(data) {
      var message = data;
      // Assuming the error is raised by the YouTube API, data will be
      // a JSON string with error.message set. That may not be the
      // only time onError will be raised, though.
      try {
        var errorResponse = JSON.parse(data);
        message = errorResponse.error.message;
      } finally {
        alert(message);
      }
    }.bind(this),
    onProgress: function(data) {
      $('.post-upload').hide();
      var currentTime = Date.now();
      var bytesUploaded = data.loaded;
      var totalBytes = data.total;
      // The times are in millis, so we need to divide by 1000 to get seconds.
      var bytesPerSecond = bytesUploaded / ((currentTime - this.uploadStartTime) / 1000);
      var estimatedSecondsRemaining = (totalBytes - bytesUploaded) / bytesPerSecond;
      var percentageComplete = Math.ceil((bytesUploaded * 100) / totalBytes);

      $('#upload-progress').attr({
        value: bytesUploaded,
        max: totalBytes
      });

      $('#percent-transferred').text(percentageComplete);

      $('.during-upload').show();
    }.bind(this),
    onComplete: function(data) {
      var uploadResponse = JSON.parse(data);
      this.videoId = uploadResponse.id;
      $('.post-upload').show();
      $("#processing").show();
      $("#post_upload").hide();
      console.log("Made it here 1");
      this.pollForVideoStatus();
    }.bind(this)
  });
  // This won't correspond to the *exact* start of the upload, but it should be close enough.
  this.uploadStartTime = Date.now();
  uploader.upload();
};

UploadVideo.prototype.handleUploadClicked = function() {
  $('#button').attr('disabled', true);
  this.uploadFile($('#file').get(0).files[0]);
};

UploadVideo.prototype.pollForVideoStatus = function() {
  console.log("Made it here 2");
  this.gapi.client.request({
    path: '/youtube/v3/videos',
    params: {
      part: 'status,player',
      id: this.videoId
    },
    callback: function(response) {
      console.log("Made it here 3");
      if (response.error) {
        // The status polling failed.
        console.log("Made it here 4");
        console.log(response.error.message);
        setTimeout(this.pollForVideoStatus.bind(this), STATUS_POLLING_INTERVAL_MILLIS);
      } else {
        console.log("Made it here 5");
        var uploadStatus = response.items[0].status.uploadStatus;
        switch (uploadStatus) {
          // This is a non-final status, so we need to poll again.
          case 'uploaded':
            setTimeout(this.pollForVideoStatus.bind(this), STATUS_POLLING_INTERVAL_MILLIS);
            break;
          // The video was successfully transcoded and is available.
          case 'processed':
            $('#player').append($(response.items[0].player.embedHtml).attr("width","240").attr("height","126").removeAttr("allowfullscreen").attr("controls","0"));
            $('#video_form').append("<input type='hidden' name='videos[]' value="+$(response.items[0].player.embedHtml).attr('src')+">");
            console.log(videos);
            $('#button').attr('disabled', false);
            $('#post-upload-status').append('Video has been processed. Click "choose file" to upload another video.');
            $("#processing").hide();
            $("#post_upload").show();
            $("#submit-videos").attr("disabled",false);
            break;
          // All other statuses indicate a permanent transcoding failure.
          default:
            $('#post-upload-status').append('Transcoding failed. Check your YouTube video manager and try again.');
            break;
        }
      }
    }.bind(this)
  });
};
