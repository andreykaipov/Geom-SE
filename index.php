
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="icon" href="../../favicon.ico">

    <title>Geom SE</title>

    <!-- Bootstrap core CSS -->
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.2/css/bootstrap.min.css" rel="stylesheet" integrity="sha256-xWeRKjzyg6bep9D1AsHzUPEWHbWMzlRc84Z0aG+tyms= sha512-mGIRU0bcPaVjr7BceESkC37zD6sEccxE+RJyQABbbKNe83Y68+PyPM5nrE1zvbQZkSHDCJEtnAcodbhlq2/EkQ==" crossorigin="anonymous">

    <!-- Custom styles for this template -->
    <link href="navbar.css" rel="stylesheet">
  </head>

  <body>

    <div class="container">
      <nav class="navbar navbar-light bg-faded">
        <button class="navbar-toggler hidden-sm-up" type="button" data-toggle="collapse" data-target="#navbar-header" aria-controls="navbar-header">
          &#9776;
        </button>
        <div class="collapse navbar-toggleable-xs" id="navbar-header">
          <a class="navbar-brand" href="#">Geom SE</a>
          <ul class="nav navbar-nav">
            <li class="nav-item active">
              <a class="nav-link" href="#">Home <span class="sr-only">(current)</span></a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Browse</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">About</a>
            </li>
          </ul>
        </div>
      </nav> <!-- /navbar -->

      <!-- Main component for a primary marketing message or call to action -->
      <div class="jumbotron">
        <h3>Upload</h3>
        <label id="i-file" class="file">
          <input type="file" id="file">
          <span class="file-custom"></span>
        </label>
      </div>

      <?php
        include 'ChromePhp.php';
        ChromePhp::log('Hello console!');
        ChromePhp::log($_SERVER);
        ChromePhp::warn('something went wrong!');
        echo "My first PHP script!";
      ?>

    </div> <!-- /container -->


    <!-- Bootstrap core JavaScript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.2/js/bootstrap.min.js" integrity="sha256-GMscmjNs6MbZvXG2HRjP3MpdOGmXv078SRgH7M723Mc= sha512-1wnhBRtA+POGVA0yREk2RlDbJEdkNvMuRBGjT1FCI5wXmpiQHZWDIB8MpANBWM/GKSPDgCA/7HTrAIFgv70/Jw==" crossorigin="anonymous"></script>

    <script src="upload.js"></script>
  </body>
</html>
