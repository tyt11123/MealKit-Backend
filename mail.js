const mailer = require("nodemailer");
const { Hello } = require("./hello_template");
const { Thanks } = require("./thanks_template");



const getEmailData = (to, name, template) => {
    let data = null;

    switch (template) {
        case "hello":
            data = {
                from: "testing@abc.com",
                to,
                subject: `Well done! ${name}`,
                html: Hello()
            }
            break;
            case "thanks":
            data = {
                from: "testing@abc.com",
                to,
                subject: `Well done! ${name}`,
                html: Thanks()
            }
            break;
        default:
            data;    
    }
    return data;
}

const sendEmail = (to, name, type) => {
    const smtpTransport = mailer.createTransport({
        service: "Gmail",
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'linnie50@ethereal.email',
            pass: '2bQUGrWdCtWEEhxArb'
        }
    })

    const mail = getEmailData(to, name, type)
    
    smtpTransport.sendMail(mail, function (error, reponse) {
        if (error) {
            console.log(error)
        } else {
            console.log("email sent successfully")
        }
        smtpTransport.close();
    })
}

module.exports= {sendEmail}