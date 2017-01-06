//import {Config, CognitoIdentityCredentials} from "aws-sdk";
import * as AWS from "aws-sdk";
import * as AWSCognito from "amazon-cognito-identity-js";
import React from "react";
import ReactDOM from "react-dom";
import appConfig from "./config";
import 'whatwg-fetch';

console.log('AWSCognito', AWSCognito);


const userPool = new AWSCognito.CognitoUserPool({
  UserPoolId: appConfig.UserPoolId,
  ClientId: appConfig.ClientId,
});

console.log('userPool', userPool);


//AWSCognito.config = 'us-east-1';

class SignUpForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      newPassword: '',
    };
  }

  handleEmailChange(e) {
    this.setState({email: e.target.value});
  }

  handlePasswordChange(e) {
    this.setState({password: e.target.value});
  }

  handleNewPasswordChange(e) {
    this.setState({newPassword: e.target.value});
  }

  handleSubmit(e) {
    e.preventDefault();
    const email = this.state.email.trim();
    const password = this.state.password.trim();
    const newPassword = this.state.newPassword.trim();

    var authenticationData = {
        Username : email,
        Password : password,
    };

    const attributeList = [
      new AWSCognito.CognitoUserAttribute({
        Name: 'email',
        Value: email,
      })
    ];

    var authenticationDetails = new AWSCognito.AuthenticationDetails(authenticationData);
    
    var userData = {
        Username : email,
        Pool : userPool
    };
    var cognitoUser = new AWSCognito.CognitoUser(userData);
    
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log('access token + ' + result.getAccessToken().getJwtToken());

          
            var logins = {};
//            logins['cognito-idp.us-east-1.amazonaws.com/' + appConfig.UserPoolId] = result.getAccessToken().getJwtToken();
            logins['cognito-idp.us-east-1.amazonaws.com/' + appConfig.UserPoolId] = result.getIdToken().getJwtToken();

            console.log('AWS', AWS);
           
             AWS.config.region = appConfig.region;
             console.log('Config.region', AWS.config.region);

             AWS.CognitoIdentity.region = appConfig.region;
             console.log('AWS.CognitoIdentity.region ', AWS.CognitoIdentity.region);
             var cognitoIdentity = new AWS.CognitoIdentity();
           
           

           

            var params = {
              IdentityPoolId: appConfig.IdentityPoolId, 
              AccountId: '383086473915',
              Logins: logins
            };


            cognitoIdentity.getId(params, function(err, data) {
              if (err) {
                console.log('error in getId', err); // an error occurred
              }
              else  {
                  console.log('success: IdentityId', data.IdentityId);           // successful response

                  var cognitoConfig = {
                    region: AWS.config.region,
                    IdentityId : data.IdentityId, // your identity pool id here
                    Logins : logins
                  }

                    AWS.config.credentials = new AWS.CognitoIdentityCredentials(cognitoConfig);
                    AWS.config.region = appConfig.region;
                   
                    console.log(' Config.region', AWS.config.region);
  
                    AWS.config.credentials.refresh((error) => {
                      if (error) {
                          console.error(error);
                      } else {
                         
                           console.log('credentials', AWS.config.credentials);
                          console.log('Successfully logged!');

                          var s3 = new AWS.S3();

                          var params = {Bucket: 'www.mikegillespie.us', Key: 'upload.txt'};
                          var url = s3.getSignedUrl('putObject', params);
                          console.log('The URL is', url);
/*

                          fetch(url, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              name: 'Hubot',
                              login: 'hubot',
                            })
                          });
*/
                          s3.getObject({
                              Bucket: 'www.mikegillespie.us', 
                              Key: 'Sample Data'
                          }, function(err, data) {
                              if (err) console.log(err, err.stack); // an error occurred
                              else     console.log('success', data);           // successful response
                          });
                          
                      }
                });
              
            }
          });
         /*   
            
  //call refresh method in order to authenticate user and get new temp credentials
           Config.credentials.refresh((error) => {
              if (error) {
                  console.error(error);
              } else {
                  console.log('Successfully logged!');
              }
            });

           console.log('Config.credentials', Config.credentials);
           */


            // Instantiate aws sdk service objects now that the credentials have been updated.
           // var s3 = new S3();
/*
            s3.getObject({
              Bucket: 'mjg-master-builder', 
              Key: 'Sample Data'
            }, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log('success', data);           // successful response
            });
*/

        },


        newPasswordRequired: function(userAttributes, requiredAttributes) {
            // User was signed up by an admin and must provide new 
            // password and required attributes, if any, to complete 
            // authentication.

            // the api doesn't accept this field back
            delete userAttributes.email_verified;

            // Get these details and call 
            cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, this);
        },
        onFailure: function(err) {
            console.log('login err', err);
            alert(err);
        },

    });

/*
    userPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log('user name is ' + result.user.getUsername());
      console.log('call result: ' + result);
    });
    */
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit.bind(this)}>
        <input type="text"
               value={this.state.email}
               placeholder="Email"
               onChange={this.handleEmailChange.bind(this)}/>
        <input type="password"
               value={this.state.password}
               placeholder="Password"
               onChange={this.handlePasswordChange.bind(this)}/>
        <input type="password"
               value={this.state.newPassword}
               placeholder="New Password"
               onChange={this.handleNewPasswordChange.bind(this)}/>
        <input type="submit"/>
      </form>
    );
  }
}

ReactDOM.render(<SignUpForm />, document.getElementById('app'));

