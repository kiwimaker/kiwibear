interface FooterProps {
   currentVersion: string
}

const Footer = ({ currentVersion = '' }: FooterProps) => {
   return (
      <footer className='text-center flex flex-1 justify-center pb-5 items-end'>
         <span className='text-gray-500 text-xs'>
            KiwiBear v{currentVersion || '0.0.0'}
         </span>
      </footer>
   );
};

export default Footer;
