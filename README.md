# **Browser Privacy Monitor**
Reveals data websites keep about you.  
  
It bridges Web2 and Web3 by making companies accountable about the information they collect about their users.  
Web3 refers to a loose set of rules about the internet of the future, in which users own and control their personal data. Web2 paradigm is what prevails today, where companies running websites have almost no responsibility about what they gather about their customers and do with that data.  
Some changes in the right direction have been implemented, or are planned for the near future.  
Laws and regulations are slowly getting enforced, like General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), but the problem is that we are presented with a lot of small print and still have no idea about what we are agreeing to.  
Third party cookies used to be the prevalent way of tracking users and exchanging information between websites. They are gradually being suspended and replaced by more sophisticated methods.  
Some tools to block ads and tracking already exist. They either use databases of known culprits to decide what to block, or AI, to guess malicious uses. What seems to be lacking is better visibility, what browsers and websites specifically do to each user individually, as opposed to just blocking a domain or listing it somewhere as dubious.  
  
**Browser Privacy Monitor** helps analyze, visualize and notify about website activity related to user data.  
The proposed blueprint, subject to change depending on user feedback, defines following milestones:  
1. Browser extension showing number of cookies each website keeps about the user
2. Aggregate all cookies browser keeps and show the total
3. Classify and visualize different types of information by different categories
4. Use Datoris analytics platform API to produce aggregated reports about website activity related to personal information. Data sent to the service is encrypted so that it is anonymous and has no meaning to the server
5. Use Zero knowledge proof method to guarantee that Datoris server did not manipulate user data in any way
  
**Browser Privacy Monitor** is open source. Peer review ensures that it is secure, accurate and transparent about what it does.  

## Installing

## Building

Minimum [Node.js](nodejs.org) version: `12.22.12`.  
Minimum [npm](npmjs.com) version: `6.14.16`.

Install dependencies  
`npm i`

Start development mode and watch files for changes  
`npm run dev`

Build for production  
`npm run build`

## Bug reports, feature requests, contributing
