import React from 'react';
import Page from './Page';

const AboutPage = () => {
  return (
    <Page title="About">
      <div className="col-6">
        <h1>About</h1>
        <p>Hi! My name is Campbell Alden, and I've been studying chess for several years now. I finally got to the point where I felt like my lack of
          understanding in the opening was the weakest part of my game. I began searching for resources to study / build up an opening book for myself
          but was dismayed to find that rote memorization was still the norm.</p>
        <p>Outside of chess, I have also been studying Japanese and have fallen in love with an app called Anki for memorizing vocabulary words. Anki is based
          on an spaced repetition system (SRS) which takes advantage of how humans actually remember things. First I began looking for Anki templates for chess
          openings but ultimately decided that a more interactive solution would be better and was simply missing. I created this tool to hopefully fill that gap
          for others who have been looking for something similar</p>
        <p>Lichess.org has been a big inspriation in terms of open source software, and I intend to follow suit by always staying free and never showing ads. All of the
          source code for this project is available on my github.</p>
      </div>
    </Page>
  );
};

export default AboutPage;
