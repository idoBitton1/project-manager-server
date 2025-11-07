import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const handlePrismaError = (error: unknown) => {
    if (error instanceof PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return { status: 409, message: 'Unique constraint failed' };
            case 'P2025':
                return { status: 404, message: 'Record not found' };
            default:
                return { status: 400, message: error.message };
        }
    }

    return { status: 500, message: 'Unexpected server error' };
}