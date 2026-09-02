import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';

const sha = value => createHash('sha256').update(value).digest('hex');

async function readText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to download ${url}: ${response.status}`);
  return (await response.text()).trim();
}

function listFiles(directory) {
  const items = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) items.push(...listFiles(path));
    else items.push(path);
  }
  return items;
}

const sourceBase = 'https://raw.githubusercontent.com/a920265362/Agent-S/enjoydowas-water-template-v1/deploy/enjoydowas-water-template';
let sourceEncoded = '';
for (let i = 0; i < 9; i += 1) {
  sourceEncoded += await readText(`${sourceBase}/site.part${String(i).padStart(2, '0')}`);
}
const sourceArchive = Buffer.from(sourceEncoded, 'base64');
if (sourceArchive.length !== 54469) throw new Error(`Source archive size mismatch: ${sourceArchive.length}`);
if (sha(sourceArchive) !== '7b8880fb0958ae994bdff42c8791954a7a61dbceebb8339a7b8a905de8fe28d3') {
  throw new Error(`Source archive checksum mismatch: ${sha(sourceArchive)}`);
}

rmSync('source', { recursive: true, force: true });
rmSync('dist', { recursive: true, force: true });
mkdirSync('source', { recursive: true });
writeFileSync('/tmp/enjoydowas-source.tar.gz', sourceArchive);
execFileSync('tar', ['-xzf', '/tmp/enjoydowas-source.tar.gz', '-C', 'source'], { stdio: 'inherit' });

const generatorBase = 'https://raw.githubusercontent.com/a920265362/Agent-S/enjoydowa-shop-redesign-20260902/deploy/enjoydowa-shop-redesign/brparts';
const generatorParts = [
  ['gen.part00', 2700, '8445db0601e2910f51af81f1598d1904d0f7f3f96b78aaa88822633fd75842b7'],
  ['gen.part01', 2700, 'ca016209cc4d8e91e60ef53eb82f7883bd5fae5c38a8c403eb069c37b18845c7'],
  ['gen.part02', 2700, '289b1dd9a5cb322981b4ac6dda7fdb3db33dc59f8fcda74684adafad658e590e'],
  ['gen.part03', 2700, '3bf90d170cc71c9fd3e18b0bbc6324b7bdaf195aaec327caf987aa70450985ef'],
  ['gen.part04', 2700, '1209ceda34a8c8251ad474eee090b1acfc801d8237a3679944f2eea410d17799'],
  ['gen.part05', 2700, '41da118cbd8569c02ace6e4d1113fcbeeefa37aaf7f326030432659ba96a3793'],
  ['gen.part06', 2700, 'd1cd72c035d7ee69a3467ef018a0eb804f018ff7e8894b84558e5d3915f6557e'],
  ['gen.part07', 2452, 'b0725464d72ba6080119aa3a1ef9694759b99069f92123860b6d046463ec898c']
];
let generatorEncoded = '';
for (const [name, size, hash] of generatorParts) {
  const text = await readText(`${generatorBase}/${name}`);
  if (text.length !== size) throw new Error(`${name} size mismatch: ${text.length}`);
  if (sha(text) !== hash) throw new Error(`${name} checksum mismatch: ${sha(text)}`);
  generatorEncoded += text;
}
const generatorBrotli = Buffer.from(generatorEncoded, 'base64');
if (generatorBrotli.length !== 16013) throw new Error(`Generator archive size mismatch: ${generatorBrotli.length}`);
if (sha(generatorBrotli) !== 'd34b6849d2f7c006c91d1e20967a4e54432a5fefceca79cdc5766d08f632b1ab') {
  throw new Error(`Generator archive checksum mismatch: ${sha(generatorBrotli)}`);
}
writeFileSync('generate.py', brotliDecompressSync(generatorBrotli));
execFileSync('python3', ['generate.py'], { stdio: 'inherit' });

const homeBase = 'https://raw.githubusercontent.com/a920265362/Agent-S/enjoydowa-shop-redesign-20260902/deploy/enjoydowa-shop-redesign/home-v1';
const homeParts = [
  ['home.part00', 2700, 'cd37ab9a6f33ac0cf142f40cf46ee71e857488db7a43dcdead7334843cc423f4'],
  ['home.part01', 2700, '1a1480ec17ca5dd9eae1dccb49d85b0a9a1a85327b25f72644226671bd803978'],
  ['home.part02', 2700, '17fab6f7ce0535c6c24aa7d160fabab001abe81da268c8eabf21282c08fcde30'],
  ['home.part03', 2700, 'c59ae1188dc9917d933957d175b4a60d017e87c50ea9ca8d7fa13d1ff1647d40'],
  ['home.part04', 2700, '112a38cad3aa451baf83f9cc64af40dd1120aea510fbe51a7cc5606bfb767f25'],
  ['home.part05', 1000, 'db6f9d8adbff74d19b84ae3f10d9583c233cc3efe6e7815044982adbc6e990e9']
];
let homeEncoded = '';
for (const [name, size, hash] of homeParts) {
  const text = await readText(`${homeBase}/${name}`);
  if (text.length !== size) throw new Error(`${name} size mismatch: ${text.length}`);
  if (sha(text) !== hash) throw new Error(`${name} checksum mismatch: ${sha(text)}`);
  homeEncoded += text;
}
const homeArchive = Buffer.from(homeEncoded, 'base64');
if (homeArchive.length !== 10875) throw new Error(`Home overlay size mismatch: ${homeArchive.length}`);
if (sha(homeArchive) !== '4021cea3e2d0c9e387cc1aa45e3880698c85915264960d047d7d9266b164bdcd') {
  throw new Error(`Home overlay checksum mismatch: ${sha(homeArchive)}`);
}
writeFileSync('/tmp/home-overlay.tar.gz', homeArchive);
execFileSync('tar', ['-xzf', '/tmp/home-overlay.tar.gz', '-C', 'dist'], { stdio: 'inherit' });

const zhHomePath = 'dist/zh/index.html';
let zhHome = readFileSync(zhHomePath, 'utf8').replaceAll('生成询盘邮件', '提交询盘');
writeFileSync(zhHomePath, zhHome);

const files = listFiles('dist');
if (files.length !== 35) throw new Error(`Unexpected dist file count: ${files.length}`);
const textFiles = files.filter(path => /\.(?:html|xml|txt|css|js|json|webmanifest)$/i.test(path));
const text = textFiles.map(path => readFileSync(path, 'utf8')).join('\n');
for (const forbidden of [
  'CleanPro',
  'cleanpro-site.vercel.app',
  'ISO 9001',
  'GMP Certified',
  'REACH Compliant',
  'CE Marked',
  '15,000',
  '20,000 tons',
  '300+ formulas',
  '50+ countries',
  'Kills 99',
  'hospital-grade',
  'NSF certified',
  'EN 1276',
  'EN 14476',
  '生成询盘邮件'
]) {
  if (text.includes(forbidden)) throw new Error(`Forbidden old or unsupported content remains: ${forbidden}`);
}

for (const relative of ['index.html', 'zh/index.html']) {
  const page = readFileSync(`dist/${relative}`, 'utf8');
  const label = relative === 'index.html' ? 'English home' : 'Chinese home';
  for (const required of [
    'https://formsubmit.co/quanjiaxi8@gmail.com',
    'data-inquiry-form',
    'section customization',
    'id="process"',
    'id="faq"',
    'id="contact"',
    'rel="canonical"',
    'google-site-verification'
  ]) {
    if (!page.includes(required)) throw new Error(`${label} missing ${required}`);
  }
  if ((page.match(/<h1\b/gi) || []).length !== 1) throw new Error(`${label} must contain exactly one H1`);
  for (const match of page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) JSON.parse(match[1]);
}
if (!readFileSync('dist/index.html', 'utf8').includes('HOUSEHOLD CARE LAB')) throw new Error('English brand subtitle missing');
if (!readFileSync('dist/zh/index.html', 'utf8').includes('<small>家庭清洁产品</small>')) throw new Error('Chinese brand subtitle missing');
if (!readFileSync('dist/zh/index.html', 'utf8').includes('>提交询盘</button>')) throw new Error('Chinese submit button text missing');
if (readFileSync('dist/googlee17d0d6ad1876ec9.html', 'utf8').trim() !== 'google-site-verification: googlee17d0d6ad1876ec9.html') throw new Error('Google verification file mismatch');
if (!readFileSync('dist/robots.txt', 'utf8').includes('https://enjoydowa-shop.vercel.app/sitemap.xml')) throw new Error('robots.txt domain mismatch');
if (!readFileSync('dist/sitemap.xml', 'utf8').includes('https://enjoydowa-shop.vercel.app/')) throw new Error('Sitemap domain mismatch');

console.log(`ENJOY DOWAS redesign verified: ${files.length} deployment files`);
