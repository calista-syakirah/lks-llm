import {
   CognitoIdentityProviderClient,
   GetUserCommand,
   InitiateAuthCommand,
   InitiateAuthCommandOutput,
   AttributeType,
   ForgotPasswordCommand,
   GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
   region: process.env.AWS_REGION || "us-east-1",
});

interface RefreshTokenResult {
   accessToken: string;
   expiresIn: number;
   idToken: string;
}

interface UserInfo {
   name: string;
   email: string;
   id: string;
}

export type { CognitoIdentityProviderClient };
export default cognitoClient;

export const getUserInfo = async (accessToken: string): Promise<UserInfo> => {
   const command = new GetUserCommand({
      AccessToken: accessToken,
   });

   const response = await cognitoClient.send(command);

   if (!response.UserAttributes) {
      throw new Error("User attributes not found in the response");
   }

   const getAttribute = (name: string): string => {
      return (
         response.UserAttributes?.find(
            (attr: AttributeType) => attr.Name === name
         )?.Value || ""
      );
   };

   return {
      name: getAttribute("name"),
      email: getAttribute("email"),
      id: getAttribute("sub"),
   };
};

export const refreshAccessToken = async (
   refreshToken: string
): Promise<RefreshTokenResult> => {
   if (!process.env.COGNITO_CLIENT_ID) {
      console.error("COGNITO_CLIENT_ID is not set in environment variables");
      throw new Error("COGNITO_CLIENT_ID is not set");
   }

   const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
         REFRESH_TOKEN: refreshToken,
      },
   });

   const response: InitiateAuthCommandOutput = await cognitoClient.send(command);

   const result = response.AuthenticationResult;
   if (!result?.AccessToken || !result.ExpiresIn || !result.IdToken) {
      throw new Error("Invalid response from Cognito");
   }

   return {
      accessToken: result.AccessToken,
      expiresIn: result.ExpiresIn,
      idToken: result.IdToken,
   };
};

export const forgotPassword = async (username: string): Promise<void> => {
   if (!process.env.COGNITO_CLIENT_ID) {
      throw new Error("COGNITO_CLIENT_ID is not set");
   }

   const command = new ForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
   });

   await cognitoClient.send(command);
};

export const signIn = async (email: string, password: string): Promise<any> => {
   if (!process.env.COGNITO_CLIENT_ID) {
      throw new Error("COGNITO_CLIENT_ID is not set");
   }

   const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
         USERNAME: email,
         PASSWORD: password,
      },
   });

   const response = await cognitoClient.send(command);
   return response.AuthenticationResult;
};

export const signOut = async (accessToken: string): Promise<void> => {
   const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
   });

   await cognitoClient.send(command);
};
