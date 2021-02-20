import React, { Component } from 'react';
import './portfolio.css';
import anime from 'animejs/lib/anime.es.js';
// import ThreeScene, { renderSpace } from './ThreeScene.js';

export default class Portfolio extends Component {
  constructor(props) {
    super(props);
    this.state = {siriusOpacity: 0};
  }

  componentDidMount() {
    import('./ThreeScene.js').then((threeScene) => {
      this.threeScene = threeScene;
      this.threeScene.renderSpace();
    });

    this.letterify('.hackerText', 'hackerLetter');

    // Give a short buffer to let the font load
    setTimeout(() => {
      this.showSirius();

      setTimeout(() => {
        this.animateText();
      }, 1000);
    }, 500);
  }

  showSirius() {
    anime({
      targets: '.siriusContainer',
      opacity: 1,
      duration: 300,
      easing: 'linear'
    })

    // if Anime.js fails, lets fallback onto React rendering
    setTimeout(() => {
      this.setState({siriusOpacity: 1});
    }, 400);
  }

  letterify(cssSelector, letterClass) {
    let containers = document.querySelectorAll(cssSelector);
    containers.forEach((container) => {
      let text = container.textContent.split('');
      let result = '';
      text.forEach(function(char){
        result += '<span class="' + letterClass + '" style="opacity: 0">' + char + '</span>';
      });
      container.innerHTML = result;
    });
  }

  animateText() {
    anime.timeline({loop: false})
      .add({
        targets: '.hackerLetter',
        keyframes: [
          {opacity: 1, backgroundColor: 'rgba(0, 255, 0, 1)'},
          {backgroundColor: 'rgba(0, 0, 0, 0.7)'}
        ],
        duration: 40,
        delay: (el, i) => 20 * (i),
      })

    let chargeAnimation = anime({
      targets: '.charge',
      width: 20,
      duration: 300,
      easing: 'linear',
      delay: function(el, i, l) {
        return i * 100;
      },
      endDelay: 500,
      loop: false
    });
  }

  render() {
    return (
      <div>
        <div id="darkness">
        <div id="threescene"></div>

        <div className="blackDrop">
          <div className="flex-column-between fullscreen">
            <div className="flex-column-start">
              <div className="siriusContainer" style={{opacity: this.state.siriusOpacity}}>
                Sirius Strebe
              </div>

              <div className="flex-row-between">
                <div className="mRight">
                  <div className="hackerText huge">
                    Full-Stack Developer
                  </div>

                  <div className="hackerText mTop">
                    I build beautiful data visualizations, real-time web apps, scalable webservers.
                  </div>
                </div>


                <div>
                  <div className="infoBox">
                    Seattle, WA<br /><br />
                    <a href="mailto:siriusastrebe@gmail.com">Siriusastrebe@gmail.com</a><br /><br />
                    <a href="https://github.com/siriusastrebe" target="_blank">Github</a><br /><br />
                    <a href="/blog">Coding Blog</a>
                  </div>
                  <div className="infoBox">
                    <a href="/cosmos">Explore the stars ➪</a>
                  </div>
                </div>
              </div>
            </div>

            {/* bottom text sligtly offscreen */}
            <div style={{marginBottom: '-1.5em'}}>
              <div className="hackerText largeFont">
                About Me:
              </div>
              <div className="hackerText">
                I am named after a star ☆. I built my first website when I was 13.
              </div>
              <div className="hackerText">
                Since then, I completed my Bachelors in Computer Sciences, worked professionally for 10+ years, built interactive visualizations used by the top executives of Fortune 100 companies like CBRE and Microsoft, and helped propel startups like SigmaIQ to their Series A.
              </div>
              <div className="hackerText">
                Capable of wearing many hats, passionate learner. Sociable, clear and prompt communication, multi-media front-to-back fully encompased solutions.
              </div>
            </div>
          </div>
        </div>
        </div>


        <div className="skills">
          <div className="card leftCard mTopLarge">
            <div className="cardHeader">
              Back End
            </div>

            <div className="skillsubset">
              <div className="mTop inline-flex-row">
                <div className="greenCircle mRight">✓</div>
                <div className="technologies">
                  <div className="largeFont">Servers</div>
                  <ul>
                    Node.js,
                    Python/Django/Flask,
                    Apache/PHP, 
                    Ruby on Rails
                  </ul>
                </div>
              </div>

              <div className="mTop inline-flex-row">
                <div className="greenCircle mRight">✓</div>
                <div className="technologies">
                  <div className="largeFont">Data</div>
                  <ul>
                    SQL,
                    PostgreSQL,
                    Cassandra,
                    Kafka,
                    Redis
                  </ul>
                </div>
              </div>

              <div className="mTop inline-flex-row">
                <div className="greenCircle mRight">✓</div>
                <div className="technologies">
                  <div className="largeFont">Communication</div>
                  <ul>
                    Rest APIs,
                    Websockets,
                    GraphQL,
                    FeatherJS
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="card middleCard">
            <div className="cardHeader">
              Front End
            </div>

            <div className="skillsubset">
              <div className="mTop inline-flex-row">
                <div className="greenCircle mRight">✓</div>
                <div className="technologies">
                  <div className="largeFont">Fundamentals</div>
                  <ul>
                    15+ years of<br />
                    HTML,
                    CSS,
                    Javascript
                  </ul>
                </div>
              </div>
  
              <div className="mTop inline-flex-row">
                <div className="greenCircle mRight">✓</div>
                <div className="technologies">
                  <div className="largeFont">Frameworks</div>
                  <ul>
                    React,
                    Angular
                  </ul>
                </div>
              </div>
  
              <div className="mTop inline-flex-row">
                <div className="greenCircle mRight">✓</div>
                <div className="technologies">
                  <div className="largeFont">Visualization</div>
                  <ul>
                    D3.js,
                    Three.js,
                    Anime.js,
                    CSS Transitions, 
                    SVG
                  </ul>
                </div>
              </div>
            </div>
          </div>





          <div className="card rightCard mTopLarge">
            <div className="cardHeader">
              Dev Ops
            </div>

            <div className="skillsubset">
              <div className="mTop inline-flex-row">

                <div className="greenCircle mRight">✓</div>
                <div className="technologies">
                  <div className="largeFont">Command Line</div>
                  *nix, Bash, Nginx
                </div>
              </div>


              <div className="mTop inline-flex-row">
                <div className="greenCircle mRight">✓</div>
                <div className="technologies">
                  <div className="largeFont">Containerization</div>
                  Docker
                </div>
              </div>

              <div className="mTop inline-flex-row">
                <div className="greenCircle mRight">✓</div>
                <div className="technologies">
                  <div className="largeFont">Cloud</div>
                  <ul>
                    <li>Amazon Web Services</li>
                    <small>EC2, RDS, Cognito, IoT, DynamoDB</small>

                    <li className="mTop">Google Cloud</li>
                    <small>Compute Engine, gcloud CLI, Container Registry</small>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h1 className="heady">Live Examples</h1>
        <div className="previews">
          <a href="https://www.viz.chat" target="_blank">
            <div className="preview">
              <img className="previewImg" src="./public/vizchat.png" />
              <div className="previewText">
                Tree-shaped Discussion Board
              </div>
            </div>
          </a>

          <a href="https://www.academiceats.com" target="_blank">
            <div className="preview">
              <img className="previewImg" src="./public/academiceats.png" />
              <div className="previewText">
                Lunches for Private Schools
              </div>
            </div>
          </a>

          <a href="https://www.mapthematics.com/ProjectionsList.php" target="_blank">
            <div className="preview">
              <img className="previewImg" src="./public/mapthematics.png" />
              <div className="previewText">
                Map Projections Tour
              </div>
            </div>
          </a>

          <a href="https://cdn.rawgit.com/siriusastrebe/d3spectrogram/53b0c90/index.html" target="_blank">
            <div className="preview">
              <img className="previewImg" src="./public/spectrogram.png" />
              <div className="previewText">
                Audio-Spectrogram in D3.js
              </div>
            </div>
          </a>

          <a href="https://codepen.io/siriusastrebe/full/jvyqJZ" target="_blank">
            <div className="preview">
              <img className="previewImg" src="./public/wormsim.png" />
              <div className="previewText">
                Worm Simulator
              </div>
            </div>
          </a>

          <a href="https://codepen.io/siriusastrebe/full/mGREEW/" target="_blank">
            <div className="preview">
              <img className="previewImg" src="./public/morphable.png" />
              <div className="previewText">
                Morphable Bar/Line Chart<br />In D3.js
              </div>
            </div>
          </a>

          <a href="https://codepen.io/siriusastrebe/pen/VwvrVwx" target="_blank">
            <div className="preview">
              <img className="previewImg" src="./public/earth.png" />
              <div className="previewText">
                Earth in Three.js
              </div>
            </div>
          </a>

        </div>



        <div className="fadeWhite">
          <h1 className="heady">Professional Experience</h1>
          <div className="history">
            <img className="smallLogo" src="./public/connetic.png" />
            <img className="smallLogo" src="./public/microsoft.png" />
            <img className="smallLogo" src="./public/academiceatslogo.png" style={{height: '80%'}} />
            <img className="smallLogo" src="./public/sigmaiq.png" />
            <img className="smallLogo" src="./public/embmon.png" />
            <img className="smallLogo" src="./public/cbre.png" />
            <img className="smallLogo" src="./public/Limine_With_Badge.png" />
            <img className="smallLogo" src="./public/freshconsulting.png" />
            <img className="smallLogo" src="./public/k2.png" />
            <img className="smallLogo" src="./public/powerit.png" />
            <img className="smallLogo" src="./public/nebula.png" />
            <img className="smallLogo" src="./public/wwu.png" style={{backgroundColor: '#003F87', borderRadius: '4px'}} />
            <img className="smallLogo" src="./public/mapthematicslogo.png" />
          </div>

        </div>

        <div className="centered seattle">
          This website built with <a href="https://reactjs.org/" target="_blank">React.js</a>, <a href="https://threejs.org/" target="_blank">Three.js</a>, <a href="https://animejs.com/" target="_blank">Anime.js</a><br />
          Served with <a href="https://nodejs.org/en/" target="_blank">Node.js</a>, bundled using <a href="https://webpack.js.org/" target="_blank">Webpack</a>, and <a href="https://babeljs.io/" target="_blank">Babel</a><br />

          Hosted on <a href="https://cloud.google.com" target="_blank">Google Cloud's</a> <a href="https://cloud.google.com/compute" target="_blank">Compute Engine</a><br />
          Using <a href="https://www.docker.com/" target="_blank">Docker</a> and <a href="https://cloud.google.com/container-registry" target="_blank">Google Container Registry</a>.

          <br />
          <br />

          <h3 className="coolFont" style={{fontSize: "30px"}}>Interested in working with me?</h3>
          Contact me at <a href="mailto:siriusastrebe@gmail.com">siriusastrebe@gmail.com</a>
        </div>
      </div>
    );
  }
}
