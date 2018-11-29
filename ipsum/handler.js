'use strict';

/* turn off the unused-vars rule since lambda
   will pass in a context. I will leave it here
   in case I want to use it later
*/
/* eslint no-unused-vars: "off" */
module.exports.ipsum = async function(event, context) {

   let html;

   html = `
   <html>
    <body>
     <h1>Bacon Ipsum</h1>
     <p>
        Bacon ipsum dolor amet swine spare ribs meatloaf porchetta,
        ball tip ground round turkey. Spare ribs ham hock flank capicola 
        turkey andouille. 
        Brisket andouille alcatra prosciutto, boudin beef ribs short 
        ribs ball tip drumstick pig short loin pancetta. Sirloin turkey 
        drumstick pastrami rump venison pork belly chicken landjaeger brisket cow.
        Turkey spare ribs landjaeger, filet mignon corned beef salami shankle 
        brisket beef ribs cupim boudin drumstick. Hamburger pork loin 
        pig beef picanha tail pork chop. Kielbasa rump swine pork turkey 
        sirloin t-bone pastrami bacon tongue capicola hamburger short 
        ribs flank beef ribs. Chuck ham brisket bresaola pork.
     </p>
    </body>
   </html>
   `;

   return {
      statusCode: 200,
      headers: {
         'Content-Type': 'text/html',
      },
      body: html,
   };
};
