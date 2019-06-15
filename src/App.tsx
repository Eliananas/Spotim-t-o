import React, { useState, useEffect } from 'react';
import { useRoutes } from 'hookrouter';
import SpotifyWebApi from 'spotify-web-api-js';
import Navigation from './components/Navigation';
import SpotifyAuthorization from './pages/SpotifyAuthorization';
import Home from './pages/Home';
import About from './pages/About';
import Sort from './pages/Sort';
import NotFound from './pages/NotFound';
import { Token, SpotifyData, PlaylistObjectSimplifiedWithTrackIds, TrackWithAudioFeatures } from './models/Spotify';
import { getAllSpotifyUsersPlaylists, getAllTracksInPlaylist, getAudioFeaturesForTracks } from './logic/Spotify';
import { arrayToObject } from './logic/Utils';

// const local_storage_key = 'emotionify-app';

const emptySpotifyData = {
    user: undefined,
    playlists: {},
    tracks: {},
    audioFeatures: {}
}

interface IProps { }

export const App: React.FunctionComponent<IProps> = (props: IProps) => {
    const [token, setToken] = useState<Token | undefined>(undefined);
    const [spotifyData, setSpotifyData] = useState<SpotifyData>(emptySpotifyData);

    // TODO: Possible data preservation in localStorage

    // TODO: Notice on token expiry (Get a new token before the old expires - 5min)

    const onTokenChange = (newToken: Token | undefined) => setToken(newToken);
    const onLogOut = () => onTokenChange(undefined);

    const refreshUsersPlaylists = () => {
        if (token !== undefined && spotifyData.user !== undefined) {
            getAllSpotifyUsersPlaylists(token, spotifyData.user)
                .then(playlists => {
                    setSpotifyData({ 
                        ...spotifyData,
                        playlists: arrayToObject<PlaylistObjectSimplifiedWithTrackIds>(playlists, "id")
                    });
                })
                .catch(err => console.error(err));
        }
    }

    const refreshPlaylist = (playlist: SpotifyApi.PlaylistObjectSimplified) => {
        if (token !== undefined) {
            getAllTracksInPlaylist(token, playlist)
                .then(tracks => {
                    setSpotifyData({ 
                        ...spotifyData,
                        tracks: { ...spotifyData.tracks, ...arrayToObject<TrackWithAudioFeatures>(tracks, "id") },
                        playlists: { 
                            ...spotifyData.playlists, 
                            [playlist.id]: { ...spotifyData.playlists[playlist.id], track_ids: tracks.map(t => t.id) } 
                        }
                    });
                })
                .catch(err => console.error(err));
        }
    }

    useEffect(() => { // Request the user when the token changes
        if (token === undefined) {
            setSpotifyData({ ...spotifyData, user: undefined });
        } else {
            const spotifyApi = new SpotifyWebApi();
            spotifyApi.setAccessToken(token.value);
            spotifyApi.getMe()
                .then(user => {
                    if (spotifyData.user === undefined) { // If there is currently no user, clear the playlists and put the new user in
                        setSpotifyData({ ...spotifyData, playlists: {}, user: user });
                    } else if (spotifyData.user.id !== user.id) { // If this is a new user
                        setSpotifyData({ ...spotifyData, playlists: {}, user: user });
                    } else { // Same user, new token
                        setSpotifyData({ ...spotifyData, user: user });
                    }
                })
                .catch(err => console.error(err));
        }
    }, [token]);

    useEffect(() => { // Request playlists on user change
        if (spotifyData.user === undefined) {
            setSpotifyData({ ...spotifyData, playlists: {} });
        } else {
            refreshUsersPlaylists();
        }
    }, [spotifyData.user]);

    useEffect(() => { // Request audio features when needed
        const track_ids_with_no_audio_features: string[] = Object.values(spotifyData.tracks)
            .filter(t => t.audio_features === undefined)
            .map(t => t.id);

        if (token !== undefined && track_ids_with_no_audio_features.length > 0) {
            getAudioFeaturesForTracks(token, track_ids_with_no_audio_features)
                .then(audio_features => {
                    const tracks_with_new_audio_features: TrackWithAudioFeatures[] = audio_features.map(af => { return {...spotifyData.tracks[af.id], audio_features: af} });

                    setSpotifyData({
                        ...spotifyData,
                        tracks: { ...spotifyData.tracks, ...arrayToObject<TrackWithAudioFeatures>(tracks_with_new_audio_features, "id") }
                    });
                })
                .catch(err => console.error(err));
        }
    }, [spotifyData.tracks]);

    (window as any).a = () => console.log('token', token, 'spotifyData', spotifyData);
    (window as any).b = (playlist: SpotifyApi.PlaylistObjectSimplified) => refreshPlaylist(playlist);

    const routes = {
        '/': () => <Home />,
        '/spotify-authorization': () => <SpotifyAuthorization onTokenChange={onTokenChange} />,
        '/sort': () => <Sort token={token} user={spotifyData.user} playlists={spotifyData.playlists} tracks={spotifyData.tracks} refreshPlaylist={refreshPlaylist} refreshUsersPlaylists={refreshUsersPlaylists} />,
        '/about': () => <About />,
    };
    const routeResult = useRoutes(routes);

    return <>
        <Navigation user={spotifyData.user} onLogOut={onLogOut} />
        {routeResult || <NotFound />}
    </>
}

export default App;
