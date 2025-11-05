# Movie wiki - Detailed improvement list 🚀

Follow the file fully **dont go beyond my instructions** - **follow everything**, **Dont Break Any thing**, properly read current implementation, think and fix! Rad the whole file and every setence thoroughly till the end and first tell me wht you understood, what changes I asked you to make so I can confirm. Make sure to read thoroughly and precicely.

**Follow These :**

1) **Codebase Cleaning:**

- **🚀 Organize Codebase**: Organize according to file type -> **A. Pages Folder(All html files) B.Js(All Js Files) C.Assets (all png files like favicon.png)**

> **Keep in mind**: After organizig into folders, must properly change the file connections in all html file to use correct path **ex: from ./script.js to ./js/script.js for all connections** !

2) **Change to proper url in all html files:**

Our **website** on all html file uses urls like https://moviewiki.example.com/, change to -> https://moviewiki.qzz.io/:

3) **Update Searchbox in index.html:**
- Make it look professional by Redesiging properly
- Add a mic option for voice search(next point will tell to implement voice feature in 4th point.)
- Only use icons in searchbox like mic icon,search icon etc.

4) **Implmenting voice search feature:**
- **voiceSearch.js** - Make a new js file named voiceSearch.js and add voice feature there.
- Make it robust properly working

> **Keep in Mind**: From now on as script.js already too big so new functions will be in a new js file, also helping in refactoring!

5) **Genre Pill:**

- ✅ Redesign Genre Pills
- ✅ Add better on-hover animaion, professional 
- ✅ Add infinite scrolling,(or what is called also as circular scrolling)
- ✅ The scrolling should only happen in devices where all the pills cannot be fully come in screen like mobile devices, but as the pill all can come in a screen the infinite scrolling will not be there
- ✅ Make sure it works

6) **Featured Trailers:**
- On the index.html or homepage just above popular section there will be a featured trailers sections.
- It will show the featured trailers of the first 6 loaded moveies and use them to fetch their trailer urls from imdb api.(More details in point 7, this point just about its looks.)  
- The trailers should keep autoscrolling untill user plays one trailer, again after pauses the auto scrolling will start.
- Also when user select a genre so the trailers will be of that genre first loaded 6.(More in point 7 when we'll talk about trailer.js implementation)
- Make sure the featured trailers are properly responsive to all devices and not overly big in size, and these trailers won't have any other features other than pause and play.

---

7) **Logic for Featured trailer in homepage:**

- ✅ create a new js file named trailer.js for featured trailer fetching
- ✅ It will collect the first 6 loaded moviews trailer url from imdb  api
- ✅ If all genre, then 2 movie from popular section, 2 from coming soon and 2 from latest, else if any genre selected the first 6 movie trailer url you'll fetch and show
- ✅ For taking reference, on how to fetch trailer urls, refer to details.html page.



> **Must Keep in Mind**: While taking reference from details.html don't make any changes in that files, just read and understand!

8) **Ad and Marquee loading problem:**

I found out that the ad and marquee is getting hidden because of the script.js loading in end of file. It tries to manipulate DOM and due to which the ad baner and marquee gets hidden.

**Solve by**:
- Using defer while fetching script and add an inline script extra to ensure that the marquee nd the ad banner shows.


9) **Adding More Proxies and Parallel Fetching For faster loading::**

Now in script.js it is only using 6 proxy urls, add more and more proxy urls and do parallel fetching for faster loading. Keep sequential fetching, if parallel fetching fails fully use sequential fetching. Make it fully robust and faster.


> **Keep In Mind**: Do not break anything while doing this enhancements, take your time, do properly without breaking and touching any extra code so you don't brek other things.

10) **Improve caching, trailer caching and making caching more robust:**

- Make caching more robust, improve caching
- Making sure caching data loads immeditely, **fast loading**
- create a caching js file for caching trailer urls too for showing them immediately
- Dont break anything, make everything more robust and fast loading

11) **Make a prfessional Splash 
screen and loader when refresh:**

Create a splash screen file at the root of the file and make it profesional looking. also build a good looking loader which appears on top of all page when page refreshed

12) **Make the ad banners more responsive:**
Use the below given html code and css styling for ad banner in every page where ad banner there for ad making ad banner responsive, by remoing any ad banner styling that are presently there.

### Code:

The issue isn’t with your Flexbox or Tailwind classes — it’s that *the ad script injects an <iframe> inside your <ins>*, and that <iframe> ignores your justify-center and margin: auto rules.

So even though your outer <div> is centered, the ad’s internal frame remains left-aligned.

Let’s fix this in a bulletproof way.

---

## ✅ Final, Tested Fix — Centered, Responsive, and Not Cut

html
<!-- Responsive Banner Ad -->
<div class="banner-ad-container">
  <ins
    class="tf6d2171a86"
    data-domain="//data527.click"
    data-affquery="/95ce2b2f40c68f0bd440/f6d2171a86/?placementName=ad1"
    data-width="728"
    data-height="90"
    style="
      display: block;
      width: 100%;
      max-width: 728px;
      height: auto;
      margin: 0 auto;
      text-align: center;
      box-sizing: border-box;
    "
  ></ins>
</div>

<script src="//data527.click/js/responsive.js" async></script>


### ✅ CSS (use this exact code)

css
.banner-ad-container {
  width: 100%;
  display: flex;
  justify-content: center;    /* centers the ad horizontally */
  align-items: center;        /* optional vertical centering */
  text-align: center;
  overflow-x: hidden;
  box-sizing: border-box;
}

.banner-ad-container ins {
  display: block !important;
  width: 100% !important;
  max-width: 728px !important;
  margin: 0 auto !important;
  text-align: center;
  box-sizing: border-box;
}

/* ✅ THIS is the real centering fix for mobile */
.banner-ad-container ins iframe {
  display: block !important;
  margin: 0 auto !important;
  width: 100% !important;
  max-width: 728px !important;
  height: auto !important;
}


---

### 🧠 Why your version wasn’t centering:

* The <iframe> generated by the ad script sits *inside the <ins>*, and your justify-center on outer div doesn’t affect its position.
* You can’t use justify-content inside a non-flex element (<ins>).
* The injected <iframe> often comes with inline styles like width:728px; margin:0;, which override your layout.

The extra CSS rule for

css
.banner-ad-container ins iframe { margin: 0 auto !important; display: block !important; }


*forces* the actual banner frame to center itself.

---

✅ This version ensures:

* The banner always stays in the middle.
* It shrinks correctly on mobile.
* It never gets cut off or pushed to one side.


***Make Sure You Follow each and everything I Said precicely. Don't go beyond what I say, break anything while making one. Also make sure t read code lines properly before any changes ensuring everything is correct. Follow everything I said, don't do an extra thing beyond my instructed improvements, edits and words. Make sure you do everything correctly, take you time, do every changes one by one, get confirmed from me everytime you are confused. Please Do Correctly.***