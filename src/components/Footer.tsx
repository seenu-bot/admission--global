import Link from 'next/link'
import Image from "next/image";

export default function Footer() {
  return (
    <footer id="universalFooter">
        <div className="container">


            <div className="footer_flex_wrap">
                <div className="CS_logo_tagline">
                   <Link href="/" className="CS_HeaderLogo">
      <Image
        src="/build/assets/logo.png"
        alt="Mythri Logo"
        width={180}
        height={32}
        className="logo-img"
        priority
      />
    </Link>
                    <div className="tagline_wrap">
                        <h3>Discover and Find the <s>Best</s> Right College</h3>
                    </div>
                </div>

                <div className="CS_social_link">
                    <a target="_blank" href="https://www.facebook.com/CollegeSearch?fref=ts"
                        className="fb_footer">facebook</a>
                    <a target="_blank" href="https://twitter.com/india_colleges" className="twitter_footer">twitter</a>
                    <a target="_blank" href="https://www.linkedin.com/school/indiacollegesearch/"
                        className="linkedin_footer">linkedin</a>
                    <a target="_blank" href="https://www.instagram.com/collegesearch_in/"
                        className="instagram_footer">instagram</a>
                </div>

                <div className="CS_contact_details">
                    <a href="tel:+919228151258">+9192281 51258</a>
                    <a href="mailto:info@admissionglobal.in">info@admissionglobal.in</a>
                </div>

                <div className="CS_footer_link">
                    <Link href="/about-us">About Us</Link>
                    <Link href="/contact-us">Contact Us</Link>
                    <Link href="/privacy-policy"> Privacy Policy</Link>
                    <Link href="/terms-and-conditions">Terms & Conditions</Link>
                </div>
            </div>

            <div className="CS_copyright">
                <p>Copyright © 2025
                    SET EDUCATION TECHNOLOGY PRIVATE LIMITED
                    All rights
                    reserved</p>
            </div>
        </div>
    </footer>
  )
}
