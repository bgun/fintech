import os

SECRET_KEY=os.environ.get("SECRET_KEY")
HOST=os.environ.get("HOST")
PORT=int(os.environ.get("PORT"))

# DATABASE_URL=os.environ.get("DATABASE_URL")
# SQLALCHEMY_DATABASE_URI=DATABASE_URL

DEBUG=os.environ.get("DEBUG", False)

del os
