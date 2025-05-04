const fetchData = function (query, cb) {
	const encodedQuery = encodeURIComponent(query);
	fetch(`https://api.github.com/search/repositories?q=${encodedQuery}&sort=stars&order=desc`)
		.then(data => data.json())
		.then(result => cb(result))
		.catch(err => console.error(err));
}

const createListItem = function (item) {
	const li = document.createElement('li');
	const span = document.createElement('span');
	
	li.classList.add('search__results__item');
	span.classList.add('--bolder');
	
	li.textContent = `${item.owner.login}/`;
	span.textContent = `${item.name}`;
	
	li.dataset.repoData = JSON.stringify({
		id: item.id,
		name: item.name,
		owner: item.owner.login,
		stars: item.stargazers_count
	});
	
	li.append(span);
	
	return li;
}

const createSavedItem = function (item) {
	const li = document.createElement('li');
	li.classList.add('saves__item');
	li.dataset.id = item.id;
	
	const a = document.createElement('a');
	a.classList.add('saves__item__data');
	a.href = `https://github.com/${item.owner}/${item.name}`;
	
	const ownerSpan = document.createElement('span');
	ownerSpan.classList.add('saves__item__owner');
	ownerSpan.textContent = item.owner;
	
	const nameSpan = document.createElement('span');
	nameSpan.classList.add('saves__item__name', '--bolder');
	nameSpan.textContent = item.name;
	
	const starsSpan = document.createElement('span');
	starsSpan.classList.add('saves__item__stars');
	starsSpan.textContent = item.stars;
	
	a.append(ownerSpan);
	a.append(document.createTextNode('/'));
	a.append(nameSpan);
	
	const closeButton = document.createElement('button');
	closeButton.classList.add('saves__item__button-close');
	
	li.append(a, starsSpan, closeButton);
	return li;
};

const debounce = (fn, ms) => {
	let timeout
	return function (...args) {
		clearTimeout(timeout)
		timeout = setTimeout(() => fn.apply(this, args), ms)
	}
}

const debouncedHandler = (() => {
	let lastQuery = '';
	
	return debounce(event => {
		const query = event.target.value.trim();
		
		if (query.length === 0) {
			resultsElement.replaceChildren();
		}
		
		if (query.length > 0 && query !== lastQuery) {
			lastQuery = query;
			
			fetchData(query, (result) => {
				if (result.items) {
					resultsElement.replaceChildren();
					result.items.slice(0, 5).forEach(repo => {
						resultsElement.appendChild(createListItem(repo));
					});
				}
			});
		}
	}, 400);
})();

const STORAGE_KEY = 'savedResults';

const getSavedResults = () => {
	const saved = localStorage.getItem(STORAGE_KEY);
	return saved ? JSON.parse(saved) : [];
}

const setSaveResults = (results) => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

const savesRender = () => {
	savesElement.replaceChildren();
	
	const saved = getSavedResults();
	for (const data of saved) {
		savesElement.appendChild(createSavedItem(data));
	}
	
	savesElement.style.opacity = saved.length === 0 ? '0' : '1';
};

const resultsHandler = function (event) {
	const repoData = JSON.parse(event.target.dataset.repoData);
	const saved = getSavedResults()
	
	if (!saved.some(repo => repo.id === repoData.id)) {
		saved.push(repoData);
		setSaveResults(saved);
		savesRender();
	}
	
	inputElement.value = '';
	resultsElement.replaceChildren();
}

const savesHandler = function (event) {
	if (event.target.tagName === 'BUTTON') {
		const li = event.target.closest('li');
		const id = Number(li.dataset.id);
		
		const updated = getSavedResults().filter(repo => repo.id !== id);
		setSaveResults(updated);
		savesRender()
	}
}

const inputElement = document.querySelector('.search__input');
const resultsElement = document.querySelector('.search__results');
const savesElement = document.querySelector('.saves');

inputElement.addEventListener('input', debouncedHandler);
resultsElement.addEventListener('click', resultsHandler);
savesElement.addEventListener('click', savesHandler);
document.addEventListener('DOMContentLoaded', () => {
  savesRender();
});
