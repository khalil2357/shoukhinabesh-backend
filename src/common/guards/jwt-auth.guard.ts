import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FirebaseService } from '../../modules/auth/firebase/firebase.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private firebase: FirebaseService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await this.firebase.verifyIdToken(token);
      
      // Find user in MongoDB using Firebase UID or Email
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { firebaseUid: decodedToken.uid },
            { email: decodedToken.email?.toLowerCase().trim() },
          ],
        },
      });

      // Auto-sync: If user authenticated via Firebase but not in MongoDB, create them now.
      if (!user) {
        if (!decodedToken.email_verified) {
          throw new UnauthorizedException('Please verify your email to activate your account.');
        }

        const name = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';
        const email = decodedToken.email?.toLowerCase().trim() || '';
        const firebaseUid = decodedToken.uid;
        const emailVerified = decodedToken.email_verified || false;

        // Generate a secure random password since we use Firebase for auth
        const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
        const hashed = await bcrypt.hash(randomPassword, 12);

        try {
          user = await this.prisma.user.create({
            data: {
              name,
              email,
              password: hashed,
              isVerified: emailVerified,
              firebaseUid,
            },
          });
        } catch (error: any) {
          // Fallback for race conditions: check if user was created by another request
          if (error.code === 'P2002') {
            user = await this.prisma.user.findFirst({
              where: { email },
            });
            if (!user) throw error; // Re-throw if it's still not found
          } else {
            throw error;
          }
        }
      }

      if (!user) {
        throw new UnauthorizedException('User profile incomplete and synchronization failed.');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive.');
      }

      // Inject the MongoDB user ID into the request
      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firebaseUid: decodedToken.uid,
      };

      return true;
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
