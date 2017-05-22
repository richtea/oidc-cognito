# oidc-cognito

NodeJS sample showing how to link between an OIDC provider and Cognito.

For the most part, you can follow the instructions on the [AWS blog](https://aws.amazon.com/blogs/security/building-an-app-using-amazon-cognito-and-an-openid-connect-identity-provider/). This application replaces the client application described in that post. However, there are a couple of setup steps you will need to perform.

## Getting Started

In order to use this application, you will need to set up your Cognito identity pool and DynamoDB data store as described in the linked blog post, and you will need an OpenID Connect (OIDC) server.

There are a couple of further steps to get the application running.

### 1. Create a self-signed localhost certificate

Assuming you are running this on localhost, you will need to generate a self-signed certificate and private key to enable HTTPS. Follow the instructions [here](https://certsimple.com/blog/localhost-ssl-fix) to do this on OS X. You will need to edit the files in the `.localhost-ssl` directory and add your own certificate and key information.

(You might want to prevent yourself pushing changes to the server that contain your certificate and key - if so, the following command will prevent git from doing so:

`git update-index --skip-worktree .localhost-ssl/*`

### 2. Update the configuration settings file

Update the sample configuration file `config/config.json` with your AWS and OIDC server details.

As above, you might want to prevent accidental commits of your changes:

`git update-index --skip-worktree .config/*`

### 3. You're done!

That's it - just run `npm start` to start the server, then browse to [https://localhost:8000](https://localhost:8000) to see it in action.