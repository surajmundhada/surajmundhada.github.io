const toggle=document.getElementById('theme-toggle');
function updateThemeLabel(){const dark=document.documentElement.dataset.theme==='dark';toggle.setAttribute('aria-label',`Switch to ${dark?'light':'dark'} mode`);toggle.title=toggle.getAttribute('aria-label');}
toggle.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('suraj-theme',next)}catch{}updateThemeLabel()});
updateThemeLabel();
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',event=>{try{if(localStorage.getItem('suraj-theme'))return}catch{}document.documentElement.dataset.theme=event.matches?'dark':'light';updateThemeLabel()});
document.getElementById('year').textContent=new Date().getFullYear();
document.getElementById('copy-email').addEventListener('click',async()=>{const status=document.getElementById('copy-status');try{await navigator.clipboard.writeText('surajmundhada24@gmail.com');status.textContent='Copied!'}catch{status.textContent='Select the email to copy it.'}setTimeout(()=>status.textContent='',3000)});

// A quiet greeting, anchored to the quote. No scroll or pointer tracking.
(() => {
  const avatar = document.getElementById('companion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function greet() {
    if (reduced.matches || avatar.classList.contains('greeting')) return;
    avatar.classList.add('greeting');
  }
  avatar.addEventListener('pointerenter', greet);
  avatar.addEventListener('click', greet);
  avatar.addEventListener('animationend', () => avatar.classList.remove('greeting'));
  reduced.addEventListener('change', () => avatar.classList.remove('greeting'));
})();
