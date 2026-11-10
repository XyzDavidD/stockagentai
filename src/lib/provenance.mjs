export function sourceCategory(kind){
 if(['Bursă','Registru oficial'].includes(kind))return 'Oficială · bursă / registru';
 if(kind==='Emitent')return 'Oficială · emitent';
 if(kind==='Comunicate distribuite')return 'Comunicat distribuit · de verificat';
 if(kind?.includes('Agregator'))return 'Neoficială · agregator';
 return 'Neoficială · presă';
}
export function isSpeculative(title){return /rumou?r|reportedly|could|may\b|consider|weigh|eyeing|zvon|ar putea|analizeaza|spekulat|erwagt|envisage/i.test(String(title).normalize('NFD').replace(/[\u0300-\u036f]/g,''));}
export function isPossibleSpac(title){return /\bSPAC\b|acquisition corp|acquisition company|blank.check/i.test(String(title).normalize('NFD').replace(/[\u0300-\u036f]/g,''));}
