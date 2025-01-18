# This bloats up the image size, need an alternative
FROM ubuntu:latest

RUN apt-get update && apt-get install -y openssh-server

RUN useradd -m atlas

WORKDIR /home/atlas/

COPY ./challenge.sh ./start.sh
RUN chmod +x ./challenge.sh

ENTRYPOINT [ "./challenge.sh" ]
