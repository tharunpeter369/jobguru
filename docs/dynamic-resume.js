const dynamicResume= (options, themeOptions)=>{
    return `
    <!doctype html>
<html lang="en">

<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css"
        integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossorigin="anonymous">

    <title>Resume maker</title>
    <style>
        .resume {
            width: 6.1in;
            height: 7.86in;
        }

        .box {
            background-color: ${themeOptions.wholeBodyColor};
            width: 100%;
            height: 100%;
        }

        .left-side {
            color: ${themeOptions.leftTextColor};
            width: 33%;
            height: 100%;
            background-color: ${themeOptions.leftBackgroundColor};

        }

        .right-side {
            height: 100%;
            width: 65%;
            color: ${themeOptions.rightTextColor};
        }

        .name {
            font-size: 1.2rem;
        }

        .profile-image {
            width: 90%;
            margin-left: 5%;
            margin-top: 3%;
        }

        .profile-image img {
            border-radius: 50%;
        }

        .heading-text {
            font-size: 0.9rem;
        }

        .para,
        .per-info {
            font-size: 0.7rem !important;
        }

        .about .para{
            width: 93%;
        }
        .key-skills li{
            font-size: 0.7rem;
        }

    </style>

</head>

<body>
    <div class="resume border shadow d-flex aligh-items-center jusify-content-center">
        <div class="box">
            <!-- SPELLING MISTAKE -->
            <div class="left-side d-inline-block">
                <div class="profile-image">
                    <img class="img-fluid" src="/public/userprofile/${options.userid}.jpg" alt="">
              
                </div>
                <div class="contact ml-2 mt-2">
                    <div class="heading-text text-uppercase">Contact</div>
                    <p class="para mb-1">
                        House no: 72-2 Jigatola, Dhaka <br>
                        ${options.profilenumber} <br>
                        ${options.profileemail} <br>
                        ${options.Linkedin} <br>
                       
                    </p>
                </div>
                <div class="expert ml-2 mt-2">
                    <div class="heading-text text-uppercase">Expertise Area</div>
                    <p class="para mb-1">
                    ${options.expjobtitle} <br>
                    ${options.expjobfrom}-${options.expjobto} <br>
                    </p>
                </div>

                <div class="skill ml-2 mt-2">
                    <div class="heading-text text-uppercase">IT Skill</div>
                    <p class="para mb-1">
                    ${options.skills}
                    </p>
                </div>


                <div class="hobbies ml-2 mt-2">
                    <div class="heading-text text-uppercase">hobbies</div>
                    <p class="para mb-1">
                        Cricket<br>
                        Football <br>
                        Watching Movies<br>
                        Travel<br>
                    </p>
                </div>
            </div>
            <div class="right-side d-inline-block m-0 p-0 align-top">
                <h2 class="name text-uppercase ml-3 my-2">${options.profilename}</h2>

                <div class="contact ml-3 mt-3">
                    <div class="heading-text text-uppercase">About Me</div>
                    <p class="para mb-1">
                    ${options.profilebio}
                    </p>
                </div>
                <div class="personal ml-3 mt-3">
                    <div class="heading-text text-uppercase">Personal Informations</div>
                    <table class="per-info">
                        <tbody>
                            <tr class="border">
                                <td>Qualification</td>
                                <td>${options.qualificaiton}</td>
                            </tr>
                            <tr class="border">
                                <td>Country</td>
                                <td>India</td>
                            </tr>
                            <tr class="border">
                                <td>University</td>
                                <td>${options.Institute}</td>
                            </tr>
                            <tr class="border">
                                <td>Permanent Address</td>
                                <td>${options.profileaddress}</td>
                            </tr>
                        </tbody>

                    </table>
                </div>
                <div class="education ml-3 mt-3">
                    <div class="heading-text text-uppercase">Educational informations</div>
                    <table class="per-info">
                        <tbody>
                            <tr class="border">
                                <td>${options.qualificaionfromdate}-${options.qualificaiontodate}</td>
                                <td>
                                   ${options.qualificaiton}<br>
                                    CGPA 3.03 <br>
                                    Major in FInance <br>
                                    ${options.Institute}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="key-skills ml-3 mt-3">
                    <div class="heading-text text-uppercase">Key Skills</div>
                    <ul class="pl-1">
                        <li> ${options.skills}</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Optional JavaScript; choose one of the two! -->

    <!-- Option 1: jQuery and Bootstrap Bundle (includes Popper) -->
    <!-- <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ho+j7jyWK8fNQe+A12Hb8AhRq26LrZ/JpcUGGOn+Y7RsweNrtN/tE3MoK7ZeZDyx" crossorigin="anonymous"></script> -->

    <!-- Option 2: jQuery, Popper.js, and Bootstrap JS -->
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"
        integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj"
        crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"
        integrity="sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN"
        crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.min.js"
        integrity="sha384-w1Q4orYjBQndcko6MimVbzY0tgp4pWB4lZ7lr30WKz0vr/aWKhXdBNmNb5D92v7s"
        crossorigin="anonymous"></script>

</body>

</html>
    `;
}



module.exports = dynamicResume ;