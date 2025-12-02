
<template>
  <p>
      The purpose of this research is to understand the human mind.
      <b>If you're reading this, you should either put the correct
      consent form in ConsentContent.vue or message the researcher telling them
      they are still using a placeholder consent form.</b>
    </p>
    <p>
      There are no anticipated risks associated with participating in
      this study. The effects of participating should be comparable to
      those you would ordinarily experience from viewing a computer
      monitor and using a mouse or keyboard for a similar amount of
      time.
    </p>
    <p>
      Your participation in this study is completely voluntary and you
      may refuse to participate or you may choose to withdraw at any
      time without penalty or loss of benefits to which you are
      otherwise entitled. Your participation in this study will remain
      confidential. No personally identifiable information will be
      associated with your data.
    </p>
    <p>
      If you have questions or concerns about your participation or
      payment or want to request a summary of research findings, please
      contact the researcher at {{ useConfig().contactEmail }}.
      
      <!-- For
      any other problems related to this study, you may also contact the
      faculty member supervising this work: Fiery Cushman,
      cushman@fas.harvard.edu. For questions, concerns, suggestions, or
      complaints that have not been or cannot be addressed by the
      researcher, or to report research-related harm, please contact the
      Committee on the Use of Human Subjects in Research at Harvard
      University. Phone: 617-496-2847. Email: cuhs@fas.harvard.edu.
      Please print or save a copy of this form for your records. -->
    </p>
</template>