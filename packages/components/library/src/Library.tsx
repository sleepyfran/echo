import { Library, Player } from "@echo/core-types";
import { AppLive } from "@echo/services-bootstrap-services";
import { Rx } from "@effect-rx/rx";
import { Layer, Stream } from "effect";
import { Suspense } from "react";
import { LibraryLive } from "@echo/services-library";
import { PlayerLive } from "@echo/services-player";
import { useRx, useRxSuspenseSuccess } from "@effect-rx/rx-react";

const runtime = Rx.runtime(
  Layer.mergeAll(LibraryLive, PlayerLive).pipe(Layer.provide(AppLive)),
);
const observeLibrary = runtime.rx(Stream.unwrap(Library.observeAlbums()));
const playAlbumFn = runtime.fn(Player.playAlbum);

const UserLibrary = () => {
  const albums = useRxSuspenseSuccess(observeLibrary).value;
  const [, playAlbum] = useRx(playAlbumFn);

  return (
    <div>
      <br />
      {albums.map((album) => (
        <div key={album.id}>
          <h3>{album.name}</h3>
          <p>{album.artist.name}</p>
          <button onClick={() => playAlbum(album)}>Play</button>
          <hr />
        </div>
      ))}
    </div>
  );
};

export const UserLibraryWithSuspense = () => (
  <Suspense fallback="Loading library...">
    <UserLibrary />
  </Suspense>
);
