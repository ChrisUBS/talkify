import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { Profile } from "next-auth"
import { authService } from "@/services/api"

// Extended Profile interface to include Google-specific fields
interface GoogleProfile extends Profile {
  picture?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Cuando el usuario se autentica
      if (account && account.id_token) {
        try {
          // Enviar el token de Google a nuestra API
          const response = await authService.loginWithGoogle(account.id_token);
          
          // Agregar el token JWT desde nuestra API al token de NextAuth
          token.accessToken = response.accessToken;
          token.user = response.user;
          
          // Preservar la imagen de perfil de Google en caso de que la API no la devuelva
          if (profile) {
            const googleProfile = profile as GoogleProfile;
            if (googleProfile.image || googleProfile.picture) {
              token.userImage = googleProfile.image || googleProfile.picture;
            }
          }
          
        } catch (error) {
          console.error("Error durante la autenticación con la API:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Pasar el token de acceso a la sesión
      session.accessToken = token.accessToken as string;
      
      // Actualizar los datos del usuario con la información de nuestra API
      if (token.user) {
        session.user = token.user as any;
        
        // Asegurarse de que haya una imagen
        // Primero intentamos usar profilePicture de la API, luego image del token, y finalmente la imagen de Google
        if (!session.user.image) {
          // Use empty string instead of null as fallback
          session.user.image = session.user.profilePicture || (token.userImage as string) || "";
        }
      }
      
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)