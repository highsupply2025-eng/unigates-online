const footerLinks = [
  ["FAQ", "Investor Relations", "Privacy", "Speed Test"],
  ["Help Center", "Jobs", "Cookie Preferences", "Legal Notices"],
  ["Account", "Ways to Watch", "Corporate Information", "Only on Netflix"],
  ["Media Center", "Terms of Use", "Contact Us"],
];

const NetflixFooter = () => {
  return (
    <footer className="section-divider py-12 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <p className="text-muted-foreground mb-6">
          Questions? Call{" "}
          <a href="tel:1-844-505-2993" className="underline hover:text-foreground">
            1-844-505-2993
          </a>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {footerLinks.map((column, i) => (
            <ul key={i} className="space-y-3">
              {column.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground underline hover:text-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">Netflix Saudi Arabia</p>
      </div>
    </footer>
  );
};

export default NetflixFooter;
