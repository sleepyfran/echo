import { AddProvider } from "@echo/components-add-provider";
import { ProviderStatus } from "@echo/components-provider-status";

export const App = () => (
  <div>
    <AddProvider />
    <ProviderStatus />
  </div>
);

// const observeLibrary = Effect.gen(function* () {
//   const library = yield* Library;
//   return yield* library.observeAlbums();
// }).pipe(Effect.provide(MainLive));

// const UserLibrary = () => {
//   const [src, setSrc] = useState<string | undefined>(undefined);
//   const [albumStream, matcher] = useStream(observeLibrary);

//   const playFirstTrack = (tracks: Track[]) => {
//     const track = tracks[0];
//     switch (track.resource.type) {
//       case "file":
//         setSrc(track.resource.uri);
//         break;
//       case "api":
//         break;
//     }
//   };

//   return matcher.pipe(
//     Match.tag("empty", () => <h1>Nothing in your library</h1>),
//     Match.tag("items", ({ items }) => (
//       <div>
//         <audio src={src} autoPlay controls />
//         {items.map(([album, tracks]) => (
//           <div key={album.id}>
//             <h1>{album.name}</h1>
//             <p>{album.artist.name}</p>
//             <button onClick={() => playFirstTrack(tracks)}>Play</button>
//             <hr />
//           </div>
//         ))}
//       </div>
//     )),
//     Match.tag("failure", () => <h1>Failed to load library</h1>),
//     Match.exhaustive,
//   )(albumStream);
// };
