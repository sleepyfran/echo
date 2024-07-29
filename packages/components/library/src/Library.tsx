import { Library, type Track } from "@echo/core-types";
import { MainLive } from "@echo/services-bootstrap";
import { Rx } from "@effect-rx/rx";
import { Layer, Stream } from "effect";
import { Suspense, useState } from "react";
import { LibraryLive } from "@echo/services-library";
import { useRxSuspenseSuccess } from "@effect-rx/rx-react";

const runtime = Rx.runtime(LibraryLive.pipe(Layer.provide(MainLive)));
const observeLibrary = runtime.rx(Stream.unwrap(Library.observeAlbums()));

const UserLibrary = () => {
  const [src, setSrc] = useState<string | undefined>(undefined);
  const albums = useRxSuspenseSuccess(observeLibrary).value;

  const playFirstTrack = (tracks: Track[]) => {
    const track = tracks[0];
    switch (track.resource.type) {
      case "file":
        setSrc(track.resource.uri);
        break;
      case "api":
        break;
    }
  };

  return (
    <div>
      <br />
      <audio src={src} autoPlay controls />
      {albums.map((album) => (
        <div key={album.id}>
          <h3>{album.name}</h3>
          <p>{album.artist.name}</p>
          <button onClick={() => playFirstTrack(album.tracks)}>Play</button>
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
