// TODO: Animation to fade out old items when searching again?? Not necessary
// TODO: Delete Event Listener for Error Messages.

window.onload = function () {
  const RATE_LIMIT = 25;

  const userForm = document.querySelector(".username-form");
  userForm.addEventListener("submit", initiateApp);

  function initiateApp(e) {
    e.preventDefault();

    // Load Elements
    const username = document.querySelector("#mal-input").value;
    const searchBar = document.querySelector(".mal-search");
    const container = document.querySelector(".search-load");

    //Remove any old errors
    const error = document.querySelector(".error");
    if (error) {
      error.remove();
    }

    // Hide searchbar
    searchBar.classList.add("disappear");

    // Create loading bar and helper text
    const loadingBar = document.createElement("progress");
    loadingBar.className = "progress is-large is-primary";
    loadingBar.setAttribute("max", "100");
    container.appendChild(loadingBar);

    // Call API using provided username, then sort and process the result.
    getDataFromMAL(username, 1)
      .then((data) => {
        loadingScreen();
        const sortedData = sortData(data);
        processData(sortedData);
      })
      .catch((error) => {
        resetLoading();
        processError(error);
        return error;
      });
  }

  function loadingScreen() {
    // Check if there are previous results and remove if necessary
    const username = document.querySelector("#mal-input").value;
    document.querySelector("#mal-input").value = "";

    const loadingBar = document.querySelector(".progress");
    const container = document.querySelector(".search-load");
    console.log(username);

    loadingBar.setAttribute("value", "0");

    if (document.querySelectorAll(".recs")) {
      const recs = document.querySelectorAll(".recs");
      recs.forEach((rec) => {
        rec.remove();
      });
    }

    if (document.querySelector(".user-title")) {
      const loadingTitle = document.querySelector(".user-title");
      loadingTitle.innerHTML = `Evaluating Recommendations for <span class='mal-name'>${username}</span>...`;
    } else {
      const loadingTitle = document.createElement("h3");
      loadingTitle.className = "user-title title is-4 has-text-white";
      loadingTitle.innerHTML = `Evaluating Recommendations for <span class='mal-name'>${username}</span>...`;
      container.insertBefore(loadingTitle, loadingBar);
    }
  }

  // Loop through top 5 recommendations and build the HTML for each and insert into webpage
  async function buildRecs(arr) {
    const recTitle = document.querySelector(".user-title");
    const username = document.querySelector(".mal-name").textContent;
    recTitle.innerHTML = `Recommendations for ${username}`;
    for (let i = 0; i < 5; i++) {
      let curRec = document.querySelector(".rec" + String(i));

      // Call API on given recommendation using mal_id, then build the recommendation box.
      getAnimeData(arr[i][0]).then((data) => {
        let curAnime = data;
        const box = document.createElement("div");
        box.className = "box recs";
        console.log(curAnime.aired.from);
        const airedDate = new Date(curAnime.aired.from);
        box.innerHTML = `
                        <div class=' media'>
                            <div class='media-content'>
                                <h5 class='title is-5'>${curAnime.title}</h5>
                            </div>
                            <div class='media-right'>
                                <p class='title is-6 has-text-primary'>${
                                  i + 1
                                }</p>
                            </div>
                        </div>
                        <div class='media'>
                            <div class='media-left'>
                                <a href='${
                                  curAnime.url
                                }' target="_blank"><img src='${
          curAnime.image_url
        }'></img></a>
                            </div>
                            <div class='media-content'>
                                <div class='field'>
                                    <div class="control">
                                        <div class="tags has-addons">
                                            <span class="tag"># of Recommendations</span>
                                            <span class="tag is-primary">${
                                              arr[i][1]
                                            }</span>
                                        </div>
                                    </div>
                                    <div class="control">
                                        <div class="tags has-addons">
                                            <span class="tag">MAL Rank</span>
                                            <span class="tag is-primary">${
                                              curAnime.rank
                                            }</span>
                                        </div>
                                    </div>
                                    <div class="control">
                                        <div class="tags has-addons">
                                            <span class="tag">Year</span>
                                            <span class="tag is-primary">${airedDate.getFullYear()}</span>
                                        </div>
                                    </div>
                                    <div class="control">
                                        <div class="tags has-addons">
                                            <span class="tag">Length</span>
                                            <span class="tag is-primary">${
                                              curAnime.episodes
                                            } episodes</span>
                                        </div>
                                    </div>
                                    <div class="section genre-section">
                                        <div class='genres tags is-grouped-multiline'>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
        curRec.appendChild(box);
        const genreSection = document.querySelectorAll(".genres");
        curAnime.genres.forEach((genre) => {
          genreSection[i].innerHTML += `
                            <div class='tag is-info'>${genre.name}</div>`;
        });
        box.classList.add("slider");
      });
      await wait(800);
    }
  }

  // Wait for ms amount of seconds.
  // Returns a promise to be used with async/await
  async function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // Takes in a sorted array of anime based on user score.
  // Checks either all anime or top 29, looks at their recommendations and then adds their weighted value to an array.
  // Returns a sorted array of recommendations based on weighted occurences.
  async function processData(arr) {
    const isDeepSearch = document.querySelector("#deep-box");
    const loading = document.querySelector(".progress");
    const amountToSearch = document.querySelector(".user-title");
    const username = document.querySelector(".mal-name").textContent;
    var searchLength = 0;
    const recommendations = {};
    let rateCounter = 0;

    if (isDeepSearch.checked) {
      searchLength = arr.length;
    } else {
      searchLength = RATE_LIMIT;
    }

    for (let i = 0; i < searchLength; i++) {
      console.log(`Progress: ${i} of ${searchLength}.`);
      amountToSearch.innerHTML = `Evaluating Recommendations for <span class='mal-name'>${username}</span>... (${i} / ${searchLength})`;
      loading.value = String(Math.floor(((i + 1) * 100) / searchLength));
      rateCounter++;
      if (rateCounter > RATE_LIMIT) {
        await wait(RATE_LIMIT * 2 * 1000 + 10000);
        rateCounter = 0;
      }
      await getRecommendations(arr[i][0])
        .then((data) => {
          rec = data.recommendations;
          if (rec) {
            for (let i = 0; i < rec.length; i++) {
              recommendations[rec[i].mal_id] =
                (recommendations[rec[i].mal_id] || 0) +
                rec[i].recommendation_count;
            }
          }
        })
        .catch((error) => {
          console.log(error.status);
          processError(error);
          return error;
        });
    }
    const sortedRecommendations = sortObject(recommendations);

    resetLoading();
    // Make a new array containing only IDs so we can compare with recommendations.
    const recIds = [];
    arr.forEach((item) => {
      recIds.push(item[0]);
    });

    const filteredRecommendations = sortedRecommendations.filter(function (
      item
    ) {
      return recIds.indexOf(Number(item[0])) === -1;
    });
    buildRecs(filteredRecommendations);
    return sortedRecommendations;
  }

  function resetLoading() {
    const loadingBar = document.querySelector(".progress");
    loadingBar.remove();
    const searchBar = document.querySelector(".mal-search");
    searchBar.classList.remove("disappear");
  }

  function processError(error) {
    const container = document.querySelector(".search-load");
    const searchBar = document.querySelector(".mal-search");
    const errorMsg = document.createElement("div");

    errorMsg.className = "notification error is-danger is-narrow";
    errorMsg.innerHTML = `
        <button class='delete'></button>
        ${error}`;

    errorMsg.addEventListener("click", (e) => {
      e.preventDefault();
      if (e.target.classList.contains("delete")) {
        errorMsg.remove();
      }
    });

    container.insertBefore(errorMsg, searchBar);
    return error;
  }

  // Takes an object, converts it to an array and sorts from highest to lowest by value
  // Returns sorted array
  function sortObject(obj) {
    var arr = [];
    for (let key in obj) {
      arr.push([key, obj[key]]);
    }
    arr.sort(function (a, b) {
      return b[1] - a[1];
    });
    return arr;
  }

  // API Fetch from Jikan for a MAL user's completed anime watch list.
  // Returns an array that contains all those anime's IDs.
  // Would be better to pass full anime object in an array, instead of just id.
  async function getDataFromMAL(username, page) {
    var animelist = [];
    console.log(username, page);
    let response = await fetch(
      `https://api.jikan.moe/v3/user/${username}/animelist/completed/${page}`
    );
    if (response.status === 404 || response.status === 400) {
      throw new Error(
        "Username does not exist or is invalid. Please try again."
      );
    }
    if (response.status === 429) {
      throw new Error(
        "Oops, the API limited our request. Please try again in a few seconds."
      );
    }
    let data = await response.json();
    await wait(500);
    for (let i = 0; i < data.anime.length; i++) {
      animelist.push([data.anime[i].mal_id, data.anime[i].score]);
    }
    //console.log(page + ' ' + animelist);
    if (animelist.length < 300) {
      console.log("exit");
      return animelist;
    }
    return animelist.concat(await getDataFromMAL(username, page + 1));
  }

  function sortData(arr) {
    sortedAnimelist = arr.sort((a, b) => {
      return b[1] - a[1];
    });
    console.log("sorted: " + sortedAnimelist);
    return sortedAnimelist;
  }

  // API fetch for an anime.
  // Returns whole anime object stream
  async function getAnimeData(id) {
    let response = await fetch(`https://api.jikan.moe/v3/anime/${id}`);
    let data = await response.json();
    await wait(500);
    return data;
  }

  // API fetch for rcommendations on a specific anime.
  // Returns Promise for an anime recommendation stream.
  async function getRecommendations(id) {
    let response = await fetch(
      `https://api.jikan.moe/v3/anime/${id}/recommendations`
    );
    await wait(500);
    let data = await response.json();
    return data;
  }
};
