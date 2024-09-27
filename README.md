# Echo

Echo is a music app that allows you to connect to multiple sources of music and
play them directly through the app. It's album focused, meaning that instead of
treating your library as a list of songs, it treats it as a list of albums, allowing
you to shuffle albums, browse them based on genres, and more.

Echo is currently in development and is not yet ready for use.

## Local setup

Echo is built using TypeScript, Lit and [Effect](https://effect.website) as the
backbone of most of the app logic. To get started, clone the repository and install
the dependencies:

```sh
yarn install
```

In order to connect to certain backends that the app supports, you'll need to
run the local server via HTTPS instead of HTTP to avoid CORS issues. To do this,
make sure you have [mkcert](https://github.com/FiloSottile/mkcert) installed and
then run:

```sh
mkcert -install
yarn setup
```

Once you've done this, make sure you have a `.env` file on the web package that
contains the configuration for the backends you want to connect to. A full example
of this file would be:

```
VITE_ECHO_BASE_URL=https://localhost:443
VITE_GRAPH_CLIENT_ID=your client ID
VITE_GRAPH_REDIRECT_URI=http://localhost:443
VITE_GRAPH_SCOPES=user.read,files.read,files.read.all
VITE_SPOTIFY_CLIENT_ID=your client ID
VITE_SPOTIFY_SECRET=your secret
```

Finally, once all this is done, you can run the app with:

```sh
yarn dev
```
