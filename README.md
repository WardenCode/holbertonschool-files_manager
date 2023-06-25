[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

# Files Manager
This project is a summary of this back-end trimester at holberton School about: authentication, NodeJS, MongoDB, Redis, pagination and background processing

## Table of contents

- [Files Manager](#files-manager)
  - [Table of contents](#table-of-contents)
  - [Installation](#installation)
  - [Features](#features)
  - [Code Style](#code-style)
  - [Tech and frameworks used](#tech-and-frameworks-used)
  - [Usage](#usage)
  - [Endpoints](#endpoints)
    - [General Endpoints](#general-endpoints)
    - [Users Endpoints](#users-endpoints)
    - [Files Endpoints](#files-endpoints)
  - [Tests](#tests)
    - [Test libraries](#test-libraries)
  - [Authors](#authors)
  - [License](#license)

## Installation

Clone the repository
```bash
git clone https://github.com/WardenCode/holbertonschool-files_manager.git
```

Enter to the directory
```bash
cd holbertonschool-files_manager
```

Install dependencies
```bash
npm install
```

## Features

* User authentication via a token
* List all files
* Upload a new file
* Change permission of a file
* View a file
* Generate thumbnails for images

## Code Style

On this project was used the [airbnb style guide](https://github.com/airbnb/javascript) for JavaScript.

## Tech and frameworks used

* [Redis](https://redis.io)
* [MongoDB](https://www.mongodb.com)
* [Express](https://expressjs.com/es/)
* [NodeJS](https://nodejs.org/en)
* [Bull](https://github.com/OptimalBits/bull#readme)

## Usage

Turn on the worker

```bash
npm run start-worker
```

Turn on the server

```bash
npm run start-server
```

Check the status of the server
```bash
curl 0.0.0.0:5000/status ; echo ""
```

Check the stats of the files of the application
```bash
curl 0.0.0.0:5000/stats ; echo ""
```

Create a user
```bash
curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "bob@dylan.com", "password": "toto1234!" }' ; echo ""
{"id":"5f1e7d35c7ba06511e683b21","email":"bob@dylan.com"}
```

Authenticate a user
```bash
bob@dylan:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"031bffac-3edc-4e51-aaae-1c121317da8a"}
```

Check the log in
```bash
bob@dylan:~$ curl 0.0.0.0:5000/users/me -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""
{"id":"5f1e7cda04a394508232559d","email":"bob@dylan.com"}
```

Upload a file

```bash
bob@dylan:~$ curl -XPOST 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" -H "Content-Type: application/json" -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }' ; echo ""
{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0}
```

Get the list of files
```bash
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
[{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0},]
```

Publish the files
```bash
curl -XPUT 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/publish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":true,"parentId":0}
```

Get the data
```bash
curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data ; echo ""
Hello Webstack!
```

## Endpoints

  ### General Endpoints

    GET /status
    Returns if Redis is alive and if the DB is alive

    GET /stat
    Return the number of users and files in DB

    POST /users
    Creates a new user in DB. Also starts a background process for generating a welcome message to the user in the console

  ### Users Endpoints
  Every authenticated endpoint of the API will look at a token inside the header `X-Token`

    GET /connect
    Signs-in the user by generating a new authentication token, reading the users credentials in an Authorization header coded in Base64

    GET /disconnect
    Signs-out the user based on the token

    GET /users/me
    Retrieve the user base on the token used

  ### Files Endpoints

    POST /files
    Create a new file in DB and in disk. Also starts a background process for generating thumbnails for files of type `image`

    GET /files/:id
    Retrieves the file document based on the ID

    GET /files
    Retrieves all users file documents for a specific `parentId` and with pagination

    PUT /files/:id/publish
    Set a file document to public based on the ID

    PUT /files/:id/unpublish
    Set a file document to private based on the ID

    GET /files/:id/data
    Return the content of the file document based on the ID

## Tests
  For run tests use the following command
  ```bash
  npm run test
  ```

### Test libraries

* [Mocha](https://mochajs.org)
* [Chai](https://www.chaijs.com)

## Authors

* Diego Linares <[WardenCode](https://github.com/wardencode)>

## License

[MIT](https://choosealicense.com/licenses/mit/)
