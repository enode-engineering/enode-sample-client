# Node + Express sample client

This repo demonstrates the implementation of 3 endpoints needed by a typical implementation of an Enode API confidential client.

It is for `Hello World` purposes only, and should not be used in any production environment.

All the code of interest is in `src/index.ts`:

GET /link
  - Use client_credentials grant to obtain an access_token
  - Use that token to call [Link User](https://docs.enode.io/#operation/postUsersUseridLink)
  - Generate an OAuth authorization URL that includes the state returned from Link User above
  - Send the end user to that URL to begin the OAuth flow

GET /callback
  - Recieve the results of the oauth flow
  - Exchange the recieved authorization code for an access token
  - Transmit that token to the frontend for use in accessing the user's resources

POST /refresh
  - Use posted refresh_token to obtain a new access token
