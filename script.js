const NASCIMENTO = new Date(2005, 4, 29);

function calcularIdade(nascimento) {
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const fezAniversario =
        hoje.getMonth() > nascimento.getMonth() ||
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());
    if (!fezAniversario) idade--;
    return idade;
}

document.getElementById('idade').textContent = calcularIdade(NASCIMENTO);
document.getElementById('ano').textContent = new Date().getFullYear();

async function atualizarProjeto(card) {
    const repo = card.dataset.repo;
    try {
        const resposta = await fetch(`https://api.github.com/repos/${repo}`);
        if (!resposta.ok) return;
        const dados = await resposta.json();

        if (dados.description) {
            card.querySelector('.project-card__desc').textContent = dados.description;
        }

        const respLinguas = await fetch(dados.languages_url);
        if (!respLinguas.ok) return;
        const linguas = Object.keys(await respLinguas.json()).slice(0, 4);
        if (linguas.length > 0) {
            const lista = card.querySelector('.project-card__tags');
            lista.innerHTML = '';
            linguas.forEach(nome => {
                const li = document.createElement('li');
                li.textContent = nome;
                lista.appendChild(li);
            });
        }
    } catch (erro) {
        console.warn(`Não foi possível carregar ${repo}:`, erro);
    }
}

document.querySelectorAll('.project-card[data-repo]').forEach(atualizarProjeto);

const MATIZ_MANUAL = null;

function matizDaImagem(img) {
    const tamanho = 64;
    const canvas = document.createElement('canvas');
    canvas.width = tamanho;
    canvas.height = tamanho;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, tamanho, tamanho);
    const pixels = ctx.getImageData(0, 0, tamanho, tamanho).data;

    const pesos = new Array(36).fill(0);
    const somas = new Array(36).fill(0);

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i] / 255, g = pixels[i + 1] / 255, b = pixels[i + 2] / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        const d = max - min;
        if (d === 0 || l < 0.15 || l > 0.9) continue;
        const s = d / (1 - Math.abs(2 * l - 1));
        if (s < 0.25) continue;

        let h;
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h = (h * 60 + 360) % 360;

        const faixa = Math.floor(h / 10) % 36;
        pesos[faixa] += s;
        somas[faixa] += h * s;
    }

    let melhor = 0;
    for (let i = 1; i < 36; i++) if (pesos[i] > pesos[melhor]) melhor = i;
    if (pesos[melhor] === 0) return null;
    return Math.round(somas[melhor] / pesos[melhor]);
}

function aplicarMatiz(h) {
    document.documentElement.style.setProperty('--h', h);
}

if (MATIZ_MANUAL !== null) {
    aplicarMatiz(MATIZ_MANUAL);
} else {
    const foto = document.querySelector('.about__photo img');
    const extrair = () => {
        try {
            const h = matizDaImagem(foto);
            if (h !== null) aplicarMatiz(h);
        } catch (erro) {
            console.warn('Não foi possível ler as cores da foto:', erro);
        }
    };
    if (foto.complete && foto.naturalWidth > 0) extrair();
    else foto.addEventListener('load', extrair);
}

const alvos = document.querySelectorAll('.skill-card, .project-card, .timeline__item, .contact li');
alvos.forEach(el => el.classList.add('reveal'));

if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver(entradas => {
        entradas.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('is-visible');
                observador.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });
    alvos.forEach(el => observador.observe(el));
} else {
    alvos.forEach(el => el.classList.add('is-visible'));
}