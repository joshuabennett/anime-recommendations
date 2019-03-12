window.onload = function() {

    const userForm = document.querySelector(".username-form");
    userForm.addEventListener('submit', initiateApp);

    function initiateApp(e) {
        e.preventDefault();

        // Put up a loading screen

        const username = document.querySelector('#mal-input').value;
        getDataFromMAL(username)
            .then(data => {
                processData(data);
            })
        
    }

    // Loop through first 5 recommendations and build the HTML for each and insert into webpage
   function buildRecs(arr) {
        for(let i = 0; i < 5; i++) {
            let curRec = document.querySelector('.rec' + String(i));
            // Figure out exactly what info I want and in what Layout
            getAnimeData(arr[i][0])
                .then(data => {
                    let curAnime = data;
                    const media = document.createElement('div');
                    media.className = 'media box';
                    const mediaContent = document.createElement('div');
                    mediaContent.className = 'media-content has-text-centered';
                    mediaContent.innerHTML = `
                    <h5 class='title is-4'>${curAnime.title}</h3>
                    <a href='${curAnime.url}'><img src='${curAnime.image_url}'></img></a>
                    <p class='title is-5'>MAL Rank:</p>
                    <p class='subtitle is-6'>S${curAnime.rank}</p>`;

                    media.appendChild(mediaContent);
                    curRec.appendChild(media);
                });       
        }
    }

    // Wait for ms amount of seconds.
    // Returns a promise to be used with async/await
    async function wait(ms) {
        return new Promise(resolve => {
          setTimeout(resolve, ms);
        });
      }

    // Puts a one second wait on a function for purpose of throttling API requests.

    // Takes in a sorted array of top 15 anime, convert to Object and creates an obect that counts the reccomended anime for each of their top 15 anime.
    // Returns a sorted array of recommendations based on weighted occurences.
    async function processData(arr) {
            const recommendations = {};
        
            for (let i = 0; i < 15; i++) {
                getRecommendations(arr[i])
                    .then(data => {
                        rec = data.recommendations;
                        for (let i = 0; i < rec.length; i++) {
                            console.log(rec[i].mal_id + " " + rec[i].recommendation_count);
                            recommendations[rec[i].mal_id] = (recommendations[rec[i].mal_id] || 0) + rec[i].recommendation_count;
                        }
                    });
            }
            await wait(16000)
            const sortedRecommendations = sortObject(recommendations);
            //console.log(sortedRecommendations);
            const filteredRecommendations = sortedRecommendations.filter(function(item) {
                return (arr.indexOf(Number(item[0]))) === -1;
            });
            console.log(arr);
            //console.log(filteredRecommendations);
            buildRecs(filteredRecommendations);
            return sortedRecommendations;
    }


    // Takes an object, converts it to an array and sorts from highest to lowest by value
    // Returns sorted array
    function sortObject(obj) {
        var arr = [];
        for (let key in obj) {
            arr.push([key, obj[key]]);
        }
        arr.sort(function(a, b) {
            return b[1]-a[1];
        })
        return arr;
    }

    // API Fetch from Jikan for a MAL user's completed anime watch list.
    // Returns an array that contains all those anime's IDs.
    async function getDataFromMAL(username) {
            var animelist = [];

            let response = await fetch(`https://api.jikan.moe/v3/user/${username}/animelist/completed`);
            let data = await response.json();
            for (let i = 0; i < data.anime.length; i++) {
                animelist.push(data.anime[i].mal_id);
            }
           return animelist;
    }

    // API fetch for an anime.
    // Returns whole anime object stream
    async function getAnimeData(id) {
            let response = await fetch(`https://api.jikan.moe/v3/anime/${id}`);
            let data = await response.json();
            return data;
    }

    // API fetch for rcommendations on a specific anime.
    // Returns Promise for an anime recommendation stream.
    async function getRecommendations(id) {
        let response = await fetch(`https://api.jikan.moe/v3/anime/${id}/recommendations`);
        await wait(1000);
        let data = response.json();
        return data;
    }
}