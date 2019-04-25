FROM node:carbon

RUN mkdir /cosmos-web
WORKDIR /cosmos-web

COPY package*.json /cosmos-web
RUN npm install

COPY . /cosmos-web
RUN cd client
RUN npm install

EXPOSE 3001
EXPOSE 3000

CMD npm start && cd client && npm start