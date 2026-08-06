/*
  V9.5 can automatically discover photos and videos placed in assets/media/.
  You no longer need to edit this file for ordinary uploads.
  The lists below are fallbacks used only when assets/media/ is empty or unavailable.
*/
window.RIZVISIONS_CONTENT = {
  mediaLibrary: {
    autoDiscover: true,
    owner: "rizvisions",
    repo: "portfolio",
    branch: "main",
    path: "assets/media",
    desktopPrefix: "desktop-",
    maxDesktopItems: 6
  },

  currentCards: [
    { eyebrow: "CURRENTLY", title: "Parker", subtitle: "AI creative strategy", kind: "app", target: "parker" },
    { eyebrow: "CREATOR", title: "30M+ views", subtitle: "short-form videos and internet experiments", kind: "external", target: "https://www.tiktok.com/@riz.com" },
    { eyebrow: "BUILT AT 18", title: "Blue Specs", subtitle: "$40K+ ecommerce story", kind: "project", target: "bluespecs" },
    { eyebrow: "CREATOR ECONOMY", title: "Whop + WAP", subtitle: "$20K+ earned building reward systems", kind: "project", target: "whop" }
  ],

  desktopPhotos: [
    { id: "desktop-photo-1", type: "image", src: "assets/photos/chicago-river-bw.jpg", alt: "Chicago River", filename: "chicago_01.jpg", x: 78.2, y: 28.0, rotation: -8, width: 132, monochrome: true },
    { id: "desktop-photo-2", type: "image", src: "assets/photos/camera-bw.jpg", alt: "Camera", filename: "camera.jpg", x: 85.0, y: 25.8, rotation: 8, width: 132, monochrome: true },
    { id: "desktop-photo-3", type: "image", src: "assets/photos/hasselblad.jpg", alt: "Hasselblad camera", filename: "film.jpg", x: 79.5, y: 48.0, rotation: 7, width: 132, monochrome: true },
    { id: "desktop-photo-4", type: "image", src: "assets/photos/chicago-skyline.jpg", alt: "Chicago skyline", filename: "home.jpg", x: 86.3, y: 49.0, rotation: -6, width: 132, monochrome: true }
  ],

  photoLibrary: [
    { id: "river-01", type: "image", src: "assets/photos/chicago-river-bw.jpg", alt: "Chicago River", filename: "chicago_01.jpg", date: "August 2026", location: "Chicago" },
    { id: "camera-01", type: "image", src: "assets/photos/camera-bw.jpg", alt: "Camera", filename: "camera.jpg", date: "August 2026", location: "Chicago" },
    { id: "hasselblad-01", type: "image", src: "assets/photos/hasselblad.jpg", alt: "Hasselblad camera", filename: "film.jpg", date: "August 2026", location: "Chicago" },
    { id: "skyline-01", type: "image", src: "assets/photos/chicago-skyline.jpg", alt: "Chicago skyline", filename: "home.jpg", date: "August 2026", location: "Chicago" },
    { id: "camera-02", type: "image", src: "assets/photos/camera-bw.jpg", alt: "Camera detail", filename: "camera_detail.jpg", date: "July 2026", location: "Chicago" },
    { id: "skyline-02", type: "image", src: "assets/photos/chicago-skyline.jpg", alt: "Chicago skyline", filename: "skyline_02.jpg", date: "July 2026", location: "Chicago" },
    { id: "river-02", type: "image", src: "assets/photos/chicago-river-bw.jpg", alt: "Chicago River", filename: "river_02.jpg", date: "June 2026", location: "Chicago" },
    { id: "hasselblad-02", type: "image", src: "assets/photos/hasselblad.jpg", alt: "Film camera", filename: "film_02.jpg", date: "June 2026", location: "Chicago" },
    { id: "skyline-03", type: "image", src: "assets/photos/chicago-skyline.jpg", alt: "Chicago from the lakefront", filename: "lakefront.jpg", date: "May 2026", location: "Chicago" },
    { id: "river-03", type: "image", src: "assets/photos/chicago-river-bw.jpg", alt: "Architecture along the Chicago River", filename: "architecture.jpg", date: "May 2026", location: "Chicago" },
    { id: "camera-03", type: "image", src: "assets/photos/camera-bw.jpg", alt: "Photography setup", filename: "setup.jpg", date: "April 2026", location: "Chicago" },
    { id: "film-03", type: "image", src: "assets/photos/hasselblad.jpg", alt: "Hasselblad", filename: "hasselblad_03.jpg", date: "April 2026", location: "Chicago" }
  ]
};
